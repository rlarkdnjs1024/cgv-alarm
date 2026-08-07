import { chromium } from "playwright";
import {getMovieInfoWithDate, getOpenDateList} from "./functions.js";
import type {MovieInfo} from "./type.js";

//용산 아이맥스관 식별 코드
const SITE_NO = "0013";

//영화 오디세이 식별 코드
const MOVIE_NO = "30001323";

// 알람을 받을 최소의 좌석 개수   ,
const MINIMUM_SEAT_COUNT = 7;


async function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

async function main() {
    const browser = await chromium.launch({
        headless: false,
    });

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

    console.dir(openDates, { depth: null });

    //여기에 이전과 비교해서 새로 생긴 회차가 있을시 (에매 오픈) 알림기능 추가

    const dateList = openDates.data;

    if (dateList.length === 0) return;

    let desired: MovieInfo[] = [];
    for (let i = 0; i < openDates.data.length; i++) {
        const targetDate = dateList[i]!;
        const movieInfos = await page.evaluate(getMovieInfoWithDate, {
            siteNo: SITE_NO,
            movNo: MOVIE_NO,
            date: targetDate
        });

        if (!movieInfos.ok) {
            console.warn(`failed to fetch  movie info for ${targetDate}`, movieInfos.error);
            continue;
        }

        //장애인 좌석 제외한 좌석이 남아있고, 아이맥스인 경우만 필터링
        const filtered = movieInfos.data
            .filter(x => parseInt(x.frSeatCnt) >= MINIMUM_SEAT_COUNT && x.scnsNo === "018");

        desired = [...desired, ...filtered];
    }

    console.log(desired);
    await browser.close();
}

main().catch(console.error);

