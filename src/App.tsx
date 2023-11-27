import "./GetSpotifyData";
import GetSpotifyData from "./GetSpotifyData";
import Cookies from "universal-cookie";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DISCORD_CLIENT_ID } from "./config";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GetSpotifyData />} />
      </Routes>
    </Router>
  )
}

export default App;