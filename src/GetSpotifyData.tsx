import { useEffect, useState } from "react";
import * as utils from "./utils";
import Cookies from 'universal-cookie';
import * as log from "./logger";
import RPC from "discord-rpc";
import { DISCORD_CLIENT_ID } from "./config";
import axios from "axios";

const cookies = new Cookies();

function GetSpotifyData() {
    const addLeadingZero = (num: number) => {
        return (num < 10 ? "0" : "") + num.toString();
    }

    const token = cookies.get("spotify-token");
    const token_updated = Number(cookies.get("token-updated"));
    
    if (token) {
        const [title, setTitle] = useState("");
        const [coverUrl, setCoverUrl] = useState("");
        const [timeLeft, setTimeLeft] = useState("");

        const fetchData = async () => {
            const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                method: "GET",
                headers: { 
                    Authorization: "Bearer " + token
                    }
                }
            )
            log.debug("Fetched data from /me/player/currently-playing");
            if (res.status === 401) {
                cookies.remove("spotify-token");
                cookies.remove("token-updated");

                window.open("/login");
                window.close();
                return;
            }

            const data = await res.json();

            const title = `${utils.prepareArtists(data.item.artists)} - ${data.item.name}`;
            setTitle(title);
            setCoverUrl(data.item.album.images[1].url);

            axios.post("/updaterpc", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'X-www-form-urlencoded'
                },
                body: data,
            })
            return;
        };

        const updateTimer = () => {
            const updateTime = new Date(token_updated);
            const expireTime = updateTime.setTime(updateTime.getTime() + (60 * 60 * 1000));
            const expiresIn = new Date(expireTime - Date.now());
            const expiresInString = `${addLeadingZero(expiresIn.getMinutes())}:${addLeadingZero(expiresIn.getSeconds())}`;
            log.info("UPDATED TIMER: " + expiresInString);

            //const timeDiff = expireTime - Date.now();
            
            setTimeLeft(expiresInString);
        };
        
        useEffect(() => {
            fetchData();
            const interval = setInterval(() => fetchData(), 4000);
            return () => clearInterval(interval);
        }, []);

        useEffect(() => {
            updateTimer();
            const timerInterval = setInterval(() => updateTimer(), 1000);
            return () => clearInterval(timerInterval);
        }, []);
        
        return <div><h1>Currently playing:</h1><img src={coverUrl} /><h1>{title}</h1><h2>Token reload in: {timeLeft}</h2></div>;
    }
    else {
        return <div><h1>no token</h1><a href="/login"><h2>login</h2></a></div>
    }
}
  
export default GetSpotifyData;