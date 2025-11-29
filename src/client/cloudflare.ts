import axios from "axios";

export const getTurnServerCredentials = async () => {

  const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${process.env.TURN_TOKEN_ID}/credentials/generate-ice-servers`;

  try {
    const response = await axios.post(
      url,
      { ttl: 86400 }, 
      {
        headers: {
          Authorization: `Bearer ${process.env.TURN_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Third-party request failed:", error?.response?.data || error.message);
    throw new Error(error?.response?.data?.message || "Third-party request error");
  }
};
