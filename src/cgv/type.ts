/**
 * CGV API 공통 응답 형식
 */
export type CgvResponsePrimitive<T> = {
    /** HTTP 상태 코드 */
    statusCode: number,

    /** 상태 메시지 */
    statusMessage: string,

    /** 응답 데이터 목록 */
    data: T[],
}

/**
 * 예매 오픈 정보
 */
export type OpenDate = {
    /** 예매 오픈 날짜 'scnYmd' */
    scnYmd: string
}

/**
 * 상영 스케줄 정보
 */
export type MovieInfo = {
    /** 영화관 이름 ex) CGV 용산아이파크몰 */
    siteNm: string,

    /** 관 번호 ex) 018 용산 아이맥스는 관번호가 018 하나로 고정됨. */
    scnsNo: string,

    /** 관 이름 ex) IMAX관 */
    expoScnsNm: string,

    /** 상영일자 ex) 20260808 */
    scnYmd: string,

    /** 영화 이름 ex) 오디세이 */
    expoProdNm: string,

    /** 영화 상영 시작시간 ex) 0830 */
    scnsrtTm: string,

    /** 영화 상영 종료 시간 ex) 1132 */
    scnendTm: string,

    /** 전체 좌석 수 ex) 204 */
    stcnt: string,

    /** 잔여 좌석 수 ex) 6 */
    frSeatCnt: string
}