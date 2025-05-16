
interface UserInfo {
    username: string;
    fullname: string;
    email: string;
    [key: string]: any;
}

export default function createUser(token: string): UserInfo {
    try {
        // Get the payload part of the JWT (second part)
        const payloadBase64 = token.split('.')[1];
        
        const decodedPayload = atob(payloadBase64);
        const payload = JSON.parse(decodedPayload);
        
        // Map the JWT fields to our UserInfo structure
        const userInfo: UserInfo = {
            username: payload.preferred_username || "",
            fullname: payload.name || "",
            email: payload.email || "",
        };
        
        console.log("User created:", userInfo);
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        
        return userInfo;
    } catch (error) {
        console.error("Error parsing JWT token:", error);
        throw error;
    }
}