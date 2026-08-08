import { chromium } from "playwright";
import {
    formatDesiredMessage,
    getMovieInfoWithDate,
    getOpenDateList,
    readState,
    sendDiscordMessage, sleep,
    writeState
} from "./functions.js";
import type {MovieInfo} from "./type.js";
import "dotenv/config";


//용산 아이맥스관 식별 코드
const SITE_NO = "0013";

//영화 오디세이 식별 코드
const MOVIE_NO = "30001323";

// 알람을 받을 최소의 좌석 개수,
const MINIMUM_SEAT_COUNT = 7;

// 원하는 관 번호 리스트
const SCREEN_NO_LIST = ["018", ]




async function main() {
    let browser;
    let state = await readState();
    console.log("프로세스 시작. state:");
    console.dir(state);

    try {
        browser = await chromium.launch({
            headless: false,
        });
    } catch (e) {
        console.error("브라우저 생성에 실패했습니다. 종료합니다.");
        return;
    }

    process.on("SIGINT", async () => {

        await browser.close();

        if (state) {
            console.log(`최신 예매 일자를 ${state.lastOpenDate}로 변경합니다.`)
            await writeState(state);
        }

        console.log("프로그램 종료");
        process.exit(0);
    });

    const page = await browser.newPage();

    // CGV origin + 브라우저 세션 확보
    await page.goto(`https://cgv.co.kr/cnm/movieBook/movie`);

    while (true) {
        console.log("새로운 반복 시작");
        try {
            const openDates = await page.evaluate(getOpenDateList, {
                siteNo: SITE_NO,
                movNo: MOVIE_NO,
            });

            if (!openDates.ok) {
                console.error(openDates.error);
                return;
            }


            const dateList = openDates.data;
            console.log(`예매 가능 날짜 조회 완료.`);

            if (dateList.length === 0) {
                console.log("예매 가능 날짜가 없으므로 다음 반복으로 넘어갑니다.");
                continue;
            }


            let previousLastOpenDate = state?.lastOpenDate!;
            dateList.sort((a, b) => a.localeCompare(b));
            const lastOpenDate = dateList.at(-1)!;

            console.dir(dateList, { depth: null });
            console.log(`이전 최신 예매 오픈 날짜: ${previousLastOpenDate}`);
            console.log(`최신 예매 오픈 날짜: ${lastOpenDate}`);

            //요청을 받아서 가져온 가장 나중의 예매 오픈 날짜가 이전의 값보다 나중일떄
            if (lastOpenDate > previousLastOpenDate) {
                console.log("새로운 예매 회차가 열렸습니다.");
                //알람 기능
                await sendDiscordMessage(`🔥 CGV 예매 오픈! \n 새로운 예매 회차가 열렸습니다. ~${lastOpenDate}`);
                console.log("알람 발송 완료")
            }

            state = {
                lastOpenDate: lastOpenDate
            };
            await writeState(state);

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
                console.log("전체 기간 중 예매 가능한 회차가 없으므로 다음 반복으로 넘어갑니다.");
                continue;
            }

            console.log(`예매 가능한 회차가 총 ${desired.length}개 있습니다.`);
            desired.forEach(x => console.log(`상영일자: ${x.scnYmd}
        ${x.expoScnsNm}
        상영시간: ${x.scnsrtTm} ~ ${x.scnendTm}
        잔여 좌석 수: ${x.frSeatCnt}/${x.stcnt}
        `));

            await sendDiscordMessage(formatDesiredMessage(desired));

        } catch(e) {
            console.error("에러가 발생해서 반복을 빠져나왔습니다.");
        } finally {
            console.log("----------------------------");
            await sleep(60);
        }
    }
}

main().catch(console.error);

