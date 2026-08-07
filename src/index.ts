import { chromium } from "playwright";
import {getOpenDateList} from "./functions.js";

//용산 아이맥스관 식별 코드
const SITE_NO = "0013";

//영화 오디세이 식별 코드
const MOVIE_NO = "30001323";

//CGV URL
const BASE_PATH = "https://cgv.co.kr"


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

    //page.evaluate()는 함수를 브라우저에서 실행시킴. 이때 함수와 매개변수를 직렬화하여 브라우저에 전달한다.
    const openDates = await page.evaluate(getOpenDateList, {
        siteNo: SITE_NO,
        movNo: MOVIE_NO,
    });

    console.dir(openDates, { depth: null });

    const movieInfos = await page.evaluate(async (url) => {

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(`HTTP ${response.status}`);

        }

        return response.json();

    }, getMovieInfoListUrl);

    console.dir(movieInfos, { depth: null });


    await browser.close();

}

main();

