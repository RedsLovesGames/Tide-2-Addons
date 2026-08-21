window.WIKI = {
  groups: [
    { label: "Start", icon: "home", pages: ["home", "installation"] },
    { label: "Features", icon: "features", pages: ["shared-journal", "team-records", "record-fish", "bobbers"] },
    { label: "Reference", icon: "reference", pages: ["commands", "client-settings", "server-settings", "help"] }
  ],
  pages: {
    home: {
      path: "/", title: "Tide Team Journal", nav: "Home",
      description: "A shared Tide fishing journal for FTB Teams.", keywords: "tide team journal ftb teams fishing",
      body: `<span class="eyebrow">Build 38</span><h1>Tide Team Journal</h1>
        <p class="lead">Shares Tide fishing progress with your FTB Teams party.</p>
        <h2 id="what-it-does">What it does</h2>
        <ul><li>Shares discovered fish, Fishy Notes, catch totals, dates, and size records.</li><li>Shows who caught the largest and smallest fish.</li><li>Adds team leaderboards and catch history.</li><li>Marks record fish in your inventory.</li><li>Gives Tide bobbers luck and lure-speed bonuses.</li></ul>
        <h2 id="get-started">Get started</h2><p>Download <code>tide_team_journal_38.jar</code>, put it in your <code>mods</code> folder, and launch Minecraft.</p><a class="button primary" href="#/installation">Installation →</a>`
    },
    installation: {
      path: "/installation", title: "Installation", nav: "Installation",
      description: "Put tide_team_journal_38.jar in your mods folder.", keywords: "download install jar mods folder",
      body: `<span class="eyebrow">Start</span><h1>Installation</h1>
        <ol class="steps"><li><strong>Download the mod</strong><span><a href="https://cdn.discordapp.com/attachments/1501234602587721961/1540279234512158790/tide_team_journal_38.jar?ex=6a896052&amp;is=6a880ed2&amp;hm=a930c65ee2dd6df7b32d35ebec165823e7c59e018849400ddb6c017db047edd7" target="_blank" rel="noreferrer">Download <code>tide_team_journal_38.jar</code>.</a></span></li><li><strong>Open your Minecraft instance</strong><span>Find its <code>mods</code> folder.</span></li><li><strong>Move the JAR into the folder</strong><span>Then launch Minecraft.</span></li></ol>
        <a class="button primary" href="https://cdn.discordapp.com/attachments/1501234602587721961/1540279234512158790/tide_team_journal_38.jar?ex=6a896052&amp;is=6a880ed2&amp;hm=a930c65ee2dd6df7b32d35ebec165823e7c59e018849400ddb6c017db047edd7" target="_blank" rel="noreferrer">Download tide_team_journal_38.jar ↓</a>
        <h2 id="multiplayer">Multiplayer</h2><p>Put the same JAR in the host or server's <code>mods</code> folder and in each player's <code>mods</code> folder.</p>`
    },
    "shared-journal": {
      path: "/features/shared-journal", title: "Shared journal", nav: "Shared journal",
      description: "How Tide journal progress is shared with a party.", keywords: "shared journal party catch notes discovery",
      body: `<span class="eyebrow">Features</span><h1>Shared journal</h1><p>Your active FTB Teams party uses one Tide journal.</p>
        <h2 id="shared">What is shared</h2><ul><li>Discovered fish</li><li>Fishy Notes</li><li>Read and unread entries</li><li>Total catches</li><li>First-catch dates</li><li>Largest and smallest catches</li></ul>
        <h2 id="joining">Joining and leaving</h2><p>When you join a party, your personal journal is added to the party journal once. When you leave, the party keeps its progress and you go back to your personal journal.</p><p>Old party members stay on the leaderboard as former members. You can hide them in client settings.</p>
        <h2 id="old-worlds">Existing worlds</h2><p>Each existing teammate needs to join once so their old journal can be imported. If something is missing, run <code>/ttj merge</code>.</p>`
    },
    "team-records": {
      path: "/features/team-records", title: "Team Records", nav: "Team Records",
      description: "Team progress, leaderboards, and catch history.", keywords: "leaderboard history summary catches species records",
      body: `<span class="eyebrow">Features</span><h1>Team Records</h1><p>Open Tide's journal and click <strong>Team Records</strong>, or run <code>/ttj</code>.</p>
        <h2 id="summary">Summary</h2><p>Shows journal completion, total catches, contributors, and recent team records.</p>
        <h2 id="leaderboard">Leaderboard</h2><ul><li><strong>Catches</strong> — fish caught after tracking started</li><li><strong>Unique Species</strong> — different species caught</li><li><strong>Records Set</strong> — new team records created</li><li><strong>Active Records</strong> — records the player still holds</li></ul>
        <h2 id="history">History</h2><p>Shows first discoveries, new largest catches, new smallest catches, and record repairs. You can filter by event type or fish ID.</p><p>The server keeps the newest 200 events by default.</p>`
    },
    "record-fish": {
      path: "/features/record-fish", title: "Record fish", nav: "Record fish",
      description: "Record owners, inventory badges, alerts, and repair commands.", keywords: "largest smallest record owner badge tooltip claim assign alert",
      body: `<span class="eyebrow">Features</span><h1>Record fish</h1><p>Tide's largest and smallest lines also show the player who set each record.</p>
        <h2 id="badges">Inventory badges</h2><ul><li><strong>L</strong> means the fish is the team's largest.</li><li><strong>S</strong> means the fish is the team's smallest.</li><li>A fish can show both.</li></ul><p>The tooltip also shows the matching record size. Fish tooltips also show Tide rarity stars.</p>
        <h2 id="alerts">Record alerts</h2><p>Online teammates get a small HUD and chat alert for first discoveries and new size records. Missed events still appear in Team Records history.</p>
        <h2 id="fix-owner">Fixing an old record owner</h2><p>Hold the exact record fish and run:</p><div class="command"><code>/ttj claim largest</code><span>Claim the largest record.</span></div><div class="command"><code>/ttj claim smallest</code><span>Claim the smallest record.</span></div><p>Officers can use <code>/ttj assign</code>. Party owners can use <code>/ttj claimall</code> for a full repair.</p>`
    },
    bobbers: {
      path: "/features/bobbers", title: "Bobber bonuses", nav: "Bobber bonuses",
      description: "Luck and lure-speed bonuses added to Tide bobbers.", keywords: "bobber luck lure speed bonus",
      body: `<span class="eyebrow">Features</span><h1>Bobber bonuses</h1><p>Tide bobbers now add fishing luck, lure speed, or both. The bonus is shown in the bobber tooltip.</p>
        <h2 id="bonuses">Default bonuses</h2><div class="table-wrap"><table><thead><tr><th>Bobber</th><th>Luck</th><th>Lure speed</th></tr></thead><tbody>
        <tr><td>Colored and unlisted</td><td>—</td><td>+1</td></tr><tr><td>Golden Apple</td><td>+1</td><td>+1</td></tr><tr><td>Enchanted Golden Apple</td><td>+2</td><td>+2</td></tr><tr><td>Iron</td><td>—</td><td>+2</td></tr><tr><td>Golden</td><td>+2</td><td>—</td></tr><tr><td>Diamond</td><td>+1</td><td>+2</td></tr><tr><td>Netherite</td><td>+2</td><td>+2</td></tr><tr><td>Amethyst</td><td>+2</td><td>—</td></tr><tr><td>Echo</td><td>—</td><td>+3</td></tr><tr><td>Chorus</td><td>+1</td><td>+1</td></tr><tr><td>Feather</td><td>—</td><td>+3</td></tr><tr><td>Lichen</td><td>—</td><td>+2</td></tr><tr><td>Nautilus</td><td>+2</td><td>—</td></tr><tr><td>Pearl</td><td>+1</td><td>+2</td></tr><tr><td>Heart</td><td>+3</td><td>—</td></tr><tr><td>Grassy</td><td>+1</td><td>+1</td></tr><tr><td>Duck</td><td>—</td><td>+2</td></tr></tbody></table></div>
        <p>Server owners can change these values in <code>config/tide_team_journal-server.json</code> and reload them with <code>/ttj config reload</code>.</p>`
    },
    commands: {
      path: "/reference/commands", title: "Commands", nav: "Commands",
      description: "Every Tide Team Journal command.", keywords: "ttj commands open merge leaderboard history claim assign",
      body: `<span class="eyebrow">Reference</span><h1>Commands</h1><p><code>/ttj</code> and <code>/tideteamjournal</code> both work.</p><div class="table-wrap"><table><thead><tr><th>Command</th><th>What it does</th></tr></thead><tbody>
        <tr><td><code>/ttj</code></td><td>Open Team Records.</td></tr><tr><td><code>/ttj help</code></td><td>Show commands.</td></tr><tr><td><code>/ttj leaderboard [metric] [page]</code></td><td>Show the leaderboard.</td></tr><tr><td><code>/ttj history [page]</code></td><td>Show record history.</td></tr><tr><td><code>/ttj history fish &lt;fish_id&gt; [page]</code></td><td>Show history for one fish.</td></tr><tr><td><code>/ttj member &lt;name-or-uuid&gt;</code></td><td>Show a member's stats.</td></tr><tr><td><code>/ttj merge</code></td><td>Import missing personal progress.</td></tr><tr><td><code>/ttj claim &lt;largest|smallest&gt;</code></td><td>Claim the held record fish.</td></tr><tr><td><code>/ttj assign &lt;largest|smallest&gt; &lt;member&gt;</code></td><td>Officer: assign a record.</td></tr><tr><td><code>/ttj claimall [member]</code></td><td>Owner: assign all records.</td></tr><tr><td><code>/ttj status</code></td><td>Show owners for the held fish.</td></tr><tr><td><code>/ttj config reload</code></td><td>Operator: reload settings.</td></tr></tbody></table></div>`
    },
    "client-settings": {
      path: "/reference/client-settings", title: "Client settings", nav: "Client settings",
      description: "Personal display and alert settings.", keywords: "client settings badge tooltip alert color",
      body: `<span class="eyebrow">Reference</span><h1>Client settings</h1><p>Open <strong>Team Records → Settings</strong>. These settings only affect you.</p><ul><li>Show or hide record badges and tooltips.</li><li>Show or hide the Team Records button.</li><li>Show or hide former members.</li><li>Choose the default tab and leaderboard metric.</li><li>Change alert duration, sound, and colors.</li></ul><p>The file is <code>config/tide_team_journal-client.json</code>.</p>`
    },
    "server-settings": {
      path: "/reference/server-settings", title: "Server settings", nav: "Server settings",
      description: "Main server settings for records, permissions, history, and bobbers.", keywords: "server settings config history permission bobber",
      body: `<span class="eyebrow">Reference</span><h1>Server settings</h1><p>Edit <code>config/tide_team_journal-server.json</code>. Run <code>/ttj config reload</code> to apply changes.</p>
        <h2 id="options">What you can change</h2><ul><li>Leaderboards, history, and alerts</li><li>Visible leaderboard metrics</li><li>History length</li><li>Tracked event types</li><li>Record badges and tooltips</li><li>Claim and repair permissions</li><li>Bobber bonuses</li></ul><p>If the file is invalid, the previous working settings stay active.</p>`
    },
    help: {
      path: "/reference/help", title: "Help", nav: "Help",
      description: "Quick fixes for common problems.", keywords: "help missing catches button record config",
      body: `<span class="eyebrow">Reference</span><h1>Help</h1>
        <h2 id="missing-catches">Old catches are missing</h2><p>Have that player join the party once, then run <code>/ttj merge</code>.</p>
        <h2 id="missing-button">The Team Records button is missing</h2><p>Run <code>/ttj</code>. Check that the button is enabled in client settings.</p>
        <h2 id="unnamed-record">A record has no player name</h2><p>Beat it normally or repair it with <code>/ttj claim</code> or <code>/ttj assign</code>.</p>
        <h2 id="missing-badge">A record fish has no badge</h2><p>Check badge settings. Hold the fish and run <code>/ttj status</code>.</p>
        <h2 id="config-error">The server config did not reload</h2><p>Fix the JSON error in the server log and reload it again.</p>`
    }
  }
};
