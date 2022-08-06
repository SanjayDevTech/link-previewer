export default interface Result {
    image: {
        url: string,
        secureUrl: string | undefined,
        alt: string,
        type: string,
        width: string,
        height: string,
    }, url: string, title: string, siteName: string | undefined, description: string | undefined
};