import type {MovieInfo} from "../cgv/type.js";

export function formatDesiredMessage(list: MovieInfo[]): string {
    const lines = list.map(x => {
        const date = `${x.scnYmd.slice(0, 4)}-${x.scnYmd.slice(4, 6)}-${x.scnYmd.slice(6, 8)}`;
        const startTime = `${x.scnsrtTm.slice(0, 2)}:${x.scnsrtTm.slice(2, 4)}`;
        const endTime = `${x.scnendTm.slice(0, 2)}:${x.scnendTm.slice(2, 4)}`;
        return `• ${date} ${startTime}~${endTime} (${x.expoScnsNm}) 잔여 ${x.frSeatCnt}/${x.stcnt}석`;
    });

    return `🎟️ 예매 가능한 회차 (${list.length}건)\n${lines.join("\n")}`;
}

export async function sendDiscordMessage(message: string) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL!;

    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: message,
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Failed to send Discord message: HTTP ${response.status}`
        );
    }
}