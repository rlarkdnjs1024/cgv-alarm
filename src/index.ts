import { chromium } from "playwright";
import "dotenv/config";
import {readState, writeState} from "./state/state.js";
import {getMovieInfoWithDate, getOpenDateList, isNewDateOpen} from "./cgv/cgv.js";
import {formatDesiredMessage, needRoutineMessage, sendDiscordMessage} from "./notification/notification.js";
import type {MovieInfo} from "./cgv/type.js";
import {logTimestamp, sleep} from "./utils.js";

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
    let lastMessageSentAt;
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
        logTimestamp();
        console.log("새로운 반복 시작");

        try {
            if (!lastMessageSentAt || needRoutineMessage(lastMessageSentAt)) {
                await sendDiscordMessage("마지막 메세지로부터 한 시간이 경과하여 메세지를 자동 전송합니다.");
                lastMessageSentAt = Date.now();
            }

            const openDates = await page.evaluate(getOpenDateList, {
                siteNo: SITE_NO,
                movNo: MOVIE_NO,
            });
            console.log(`예매 가능 날짜 조회 완료.`);

            if (openDates.length === 0) {
                console.log("예매 가능 날짜가 없으므로 다음 반복으로 넘어갑니다.");
                continue;
            }


            openDates.sort((a, b) => a.localeCompare(b));
            const newLastOpenDate = openDates.at(-1)!;

            if (!state) {
                state = {
                    lastOpenDate: newLastOpenDate
                };
            }

            let previousLastOpenDate = state.lastOpenDate;

            console.dir(openDates, { depth: null });
            console.log(`이전 최신 예매 오픈 날짜: ${previousLastOpenDate}`);
            console.log(`최신 예매 오픈 날짜: ${newLastOpenDate}`);

            //요청을 받아서 가져온 가장 나중의 예매 오픈 날짜가 이전의 값보다 나중일떄
            if (previousLastOpenDate && isNewDateOpen(previousLastOpenDate, newLastOpenDate)) {
                console.log("새로운 예매 회차가 열렸습니다.");
                //알람 기능
                await sendDiscordMessage(`🔥 CGV 예매 오픈! \n 새로운 예매 회차가 열렸습니다. ~${newLastOpenDate}`);
                lastMessageSentAt = Date.now();
                console.log("알람 발송 완료")
            }

            await writeState(state);

            let desired: MovieInfo[] = [];
            for (let i = 0; i < openDates.length; i++) {
                try {
                    const targetDate = openDates[i]!;
                    const movieInfos = await page.evaluate(getMovieInfoWithDate, {
                        siteNo: SITE_NO,
                        movNo: MOVIE_NO,
                        date: targetDate
                    });

                    //장애인 좌석 제외한 좌석이 남아있고, 아이맥스인 경우만 필터링
                    const filtered = movieInfos
                        .filter(x => parseInt(x.frSeatCnt ?? "0") >= MINIMUM_SEAT_COUNT && SCREEN_NO_LIST.includes(x.scnsNo));

                    console.log(
                        filtered.length > 0 ?
                            `${targetDate}에 예매 가능한 회차가 ${filtered.length}개 있습니다.` :
                            `${targetDate}에 예매 가능한 회차가 없습니다.`
                    );

                    desired = [...desired, ...filtered];
                } catch (e) {
                    console.warn("영화 회차 정보 조회에 실패하였습니다.", e);
                }
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
            lastMessageSentAt = Date.now();

        } catch(e) {
            console.error(e);
            console.log("예상치 못 한 에러가 발생해서 반복을 빠져나왔습니다.");
        } finally {
            console.log("------------------------------------");
            await sleep(60);
        }
    }
}

main().catch(console.error);

