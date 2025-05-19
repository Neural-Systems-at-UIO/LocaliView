const API = import.meta.env.VITE_APP_API;
interface UserInfo {
    username: string;
    fullname: string;
    email: string;
    [key: string]: any;
}

function createUser(token: string): UserInfo {
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

async function checkAgreement(fullName: string, email: string): Promise<boolean> {
    try {
        const url = new URL(`${API}/check-signature`);
        url.searchParams.append('email', email);
        url.searchParams.append('fullname', fullName);
        
        
        const response = await fetch(url.toString(), {
            method: "GET"
        });
        
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        console.log("Response status:", response);
        const data = await response.json();
        return data.signed;
    } catch (error) {
        console.error("Error checking agreement:", error);
        return false;
    }
}

async function signDocument(token: string): Promise<void> {
    try {
        const url = new URL(`${API}/sign-document`);
        
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: token }),
        });
        
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        console.log("Document signed successfully");
    } catch (error) {
        console.error("Error signing document:", error);
        throw error; // Re-throw to allow caller to handle the error
    }
}

export { createUser, checkAgreement, signDocument };