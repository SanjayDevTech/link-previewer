import { fetch, json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { parse } from "node-html-parser";
import Result from "~/types";


const extractMeta: (htmlText: string) => Result = (htmlText: string) => {
    const root = parse(htmlText, {
        lowerCaseTagName: false,
        comment: false,
        blockTextElements: {
            script: false,
            noscript: false,
            style: false,
            pre: false
        },
    });
    const meta = root.querySelectorAll("meta");
    const titleTag = root.querySelector("title");
    const metadata: { [key: string]: string } = meta.filter(h => !!h.getAttribute("property")).reduce((p: { [key: string]: string }, h) => {
        if (!p[h.getAttribute("property") ?? ""]) {
            p[h.getAttribute("property") ?? ""] = h.getAttribute("content") ?? "";
        }
        return p;
    }, {});
    const image = {
        url: metadata["og:image"] ?? metadata["og:image:url"],
        secureUrl: metadata["og:image:secure_url"],
        alt: metadata["og:image:alt"],
        type: metadata["og:image:type"],
        width: metadata["og:image:width"],
        height: metadata["og:image:height"],
    };
    const url = metadata["og:url"];
    const title = metadata["og:title"] ?? titleTag?.innerText;
    const siteName = metadata["og:site_name"]
    const description = metadata["og:description"] ?? metadata["description"];

    return { image, url, title, siteName, description };
}

const stripText = (text: string, maxLength: number) => {
    if (maxLength < text.length) {
        return text.slice(0, maxLength) + "...";
    }
    return text;
}

export const action: ActionFunction = async ({
    request,
}) => {
    switch (request.method) {
        case "POST": {
            const jsonData = await request.json()
            if (jsonData.url) {
                try {
                    const response = await fetch(jsonData.url);
                    const text = await response.text();
                    let data = extractMeta(text);
                    data = { ...data, title: stripText(data.title, 55), description: stripText(data.description ?? "", 205) }
                    return json({ data });
                } catch (error) {
                    console.log(error);
                    return json({});
                }
            }
            break;
        }
        default: {
            return json({});
            break;
        }
    }
}
