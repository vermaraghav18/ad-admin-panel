import React from "react";
import XFeedForm from "../components/XFeedForm";
import XFeedsList from "../components/XFeedsList";

export default function XFeedsManagerPage() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h2 style={{ color: "#fff" }}>X Feeds Manager</h2>
      <p style={{ color: "#aaa", marginTop: -8 }}>
        Add RSS URLs for X/Twitter channels. The app will fetch the latest 5 items for each feed
        and inject banners in scroll mode (one banner per article, cycling through your feeds).
      </p>
      <XFeedForm onCreated={() => window.location.reload()} />
      <XFeedsList />
    </div>
  );
}
