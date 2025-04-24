const USER_INFO_URL = import.meta.env.VITE_APP_USER_INFO_URL;

interface UserInfo {
    username: string;
    fullname: string;
    email: string;
    [key: string]: any;
}

export default function callUser(token: string): Promise<UserInfo> {
    const userMap: Record<string, string> = {
        username: "http://schema.org/alternateName",
        fullname: "http://schema.org/name",
        email: "http://schema.org/email",
    };
    return fetch(`${USER_INFO_URL}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    })
        .then((response) => response.json())
        .then((responseData) => {
            const data = responseData.data;
            const userInfo: UserInfo = {
                username: "",
                fullname: "",
                email: "",
            };
            Object.keys(userMap).forEach((key) => {
                userInfo[key] = data[userMap[key]];
            });
            console.log("User created:", userInfo);
            localStorage.setItem("userInfo", JSON.stringify(userInfo));
            return userInfo;
        })
        .catch((error) => {
            console.error("Error fetching user info:", error);
            throw error;
        });
}