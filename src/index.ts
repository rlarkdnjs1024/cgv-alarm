import { chromium } from "playwright";
import {getMovieInfoWithDate, getOpenDateList} from "./functions.js";
import type {MovieInfo} from "./type.js";

//용산 아이맥스관 식별 코드
const SITE_NO = "0013";

//영화 오디세이 식별 코드
const MOVIE_NO = "30001323";

// 알람을 받을 최소의 좌석 개수,
const MINIMUM_SEAT_COUNT = 7;

// 원하는 관 번호 리스트
const SCREEN_NO_LIST = ["018", "011"]


async function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

async function main() {
    let browser;
    try {
        browser = await chromium.launch({
            headless: false,
        });
    } catch (e) {
        console.error("브라우저 생성에 실패했습니다.");
        return;
    }

    try {
        const page = await browser.newPage();

        // CGV origin + 브라우저 세션 확보
        await page.goto(`https://cgv.co.kr/cnm/movieBook/movie`);

        const openDates = await page.evaluate(getOpenDateList, {
            siteNo: SITE_NO,
            movNo: MOVIE_NO,
        });

        if (!openDates.ok) {
            console.error(openDates.error);
            return;
        }

        //여기에 이전과 비교해서 새로 생긴 회차가 있을시 (에매 오픈) 알림기능 추가

        const dateList = openDates.data;
        console.log(`예매 가능 날짜 조회 완료, 길이 ${dateList.length}`);
        console.dir(dateList, { depth: null });

        if (dateList.length === 0) {
            console.log("예매 가능 날짜가 없으므로 종료합니다.");
        }

        let desired: MovieInfo[] = [];
        for (let i = 0; i < openDates.data.length; i++) {
            const targetDate = dateList[i]!;
            const movieInfos = await page.evaluate(getMovieInfoWithDate, {
                siteNo: SITE_NO,
                movNo: MOVIE_NO,
                date: targetDate
            });

            if (!movieInfos.ok) {
                console.warn(`${targetDate}의 예매 정보를 불러오는데 실패했습니다.`, movieInfos.error);
                continue;
            }

            //장애인 좌석 제외한 좌석이 남아있고, 아이맥스인 경우만 필터링
            const filtered = movieInfos.data
                .filter(x => parseInt(x.frSeatCnt ?? "0") >= MINIMUM_SEAT_COUNT && SCREEN_NO_LIST.includes(x.scnsNo));

            console.log(
                filtered.length > 0 ?
                    `${targetDate}에 예매 가능한 회차가 ${filtered.length}개 있습니다.` :
                    `${targetDate}에 예매 가능한 회차가 없습니다.`
            );

            desired = [...desired, ...filtered];
        }

        if (desired.length === 0) {
            console.log("전체 기간 중 예매 가능한 회차가 없으므로 종료합니다.");
            return;
        }

        console.log(`예매 가능한 회차가 총 ${desired.length}개 있습니다.`);
        desired.forEach(x => console.log(`상영일자: ${x.scnYmd}
        ${x.expoScnsNm}
        상영시간: ${x.scnsrtTm} ~ ${x.scnendTm}
        잔여 좌석 수: ${x.frSeatCnt}/${x.stcnt}
        `));

    } catch(e) {

    } finally {
        console.log("종료");
        await browser.close();
    }
}

main().catch(console.error);

