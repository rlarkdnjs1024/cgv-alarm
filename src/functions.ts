//용산 아이맥스관 식별 코드
import type {CgvResponse, MovieInfo, OpenDate} from "./type.js";
import {NetworkError, ValidationError} from "./errors.js";

const SITE_NO = "0013";

//영화 오디세이 식별 코드
const MOVIE_NO = "30001323";

//CGV URL
const API_BASE_PATH = "https://cgv.co.kr/api/v1"

type GetOpenDateListProps = { siteNo: string, movNo: string }
type GetOpenDateListOutput = {
    ok: true,
    data: string[]
} | {
    ok: false,
    error: string
};

export async function getOpenDateList({siteNo, movNo}: GetOpenDateListProps): Promise<GetOpenDateListOutput> {
    const url = new URL("/booking/searchSiteScnscYmdListByMov", API_BASE_PATH);
    url.searchParams.set("siteNo", SITE_NO);
    url.searchParams.set("movNo", MOVIE_NO);
    url.searchParams.set("coCd", "A420");

    let response;
    try {
        response = await fetch(url);
    } catch (e) {
        if (e instanceof Error) {
            return {
                ok: false,
                error: e.message
            }
        }
        return {
            ok: false,
            error: "Failed to fetch OpenDate"
        }
    }

    let json: CgvResponse<OpenDate>;
    try {
        json = await response.json();
    } catch (e) {
        if (e instanceof Error) {
            return {
                ok: false,
                error: e.message
            }
        }
        return {
            ok: false,
            error: "Failed to parse json"
        }
    }

    const data = json.data.map(x => x.scnYmd)
    return {
        ok: true,
        data: data
    };
}


type GetMovieInfoWithDateProps = {siteNo: string, movieNo: string, date: string}

export async function getMovieInfoWithDate({siteNo, movieNo, date}: GetMovieInfoWithDateProps): Promise<MovieInfo[]> {

    const url = new URL("/booking/searchSchByMov", API_BASE_PATH);
    url.searchParams.set("siteNo", siteNo);
    url.searchParams.set("movNo", movieNo);
    url.searchParams.set("scnYmd", date);
    url.searchParams.set("coCd", "A420");
    url.searchParams.set("rtctlScopCd", "08");

    let response;
    try {
        response = await fetch(url);
    } catch (e) {
        const error = e as Error;
        throw new NetworkError("Failed to fetch");
    }

    let json: CgvResponse<MovieInfo>;
    try {
        json = await response.json();
    } catch (e) {
        const error = e as Error;
        throw new ValidationError("data is not json");
    }

    const result = json.data
    return result;

}