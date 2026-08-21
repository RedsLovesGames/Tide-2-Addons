window.WIKI = {
  groups: [
    { label: "Overview", icon: "home", pages: ["home"] },
    { label: "Getting started", icon: "start", pages: ["installation", "team-model"] },
    { label: "Features", icon: "features", pages: ["shared-journal", "team-records", "record-holders", "alerts-markers", "bobber-bonuses"] },
    { label: "Reference", icon: "reference", pages: ["commands", "client-config", "server-config"] },
    { label: "Administration", icon: "admin", pages: ["migration-repairs", "hosting", "faq"] }
  ],
  pages: {
    home: {
      path: "/",
      title: "Welcome",
      nav: "Home",
      description: "A shared Tide fishing journal, team records, and useful bobber bonuses for FTB Teams.",
      keywords: "overview features tide ftb teams fabric minecraft",
      body: `
        <section class="hero">
          <div>
            <span class="eyebrow">Complete documentation · v1.4.0</span>
            <h1>Fish together.<br>Remember everything.</h1>
            <p>Tide Team Journal turns Tide's personal fishing journal into a living team log—with shared discoveries, named size records, contributor standings, catch history, and useful bobber effects.</p>
            <div class="hero-actions">
              <a class="button primary" href="#/getting-started/installation">Install the mod →</a>
              <a class="button ghost" href="#/features/shared-journal">Explore features</a>
            </div>
          </div>
          <svg class="hero-art" viewBox="0 0 280 240" aria-hidden="true">
            <path class="wave" d="M23 200c27-16 45 16 72 0s45 16 72 0 45 16 72 0"/>
            <path class="wave" opacity=".55" d="M48 218c25-14 42 14 67 0s42 14 67 0"/>
            <path class="book" d="M28 45c39-18 73-11 112 13 39-24 73-31 112-13v137c-39-18-73-11-112 13-39-24-73-31-112-13V45Z"/>
            <path class="page" d="M38 55c33-12 63-5 96 14v108c-33-19-63-26-96-14V55Zm108 14c33-19 63-26 96-14v108c-33-12-63-5-96 14V69Z"/>
            <path class="rule" d="M140 59v132M50 80h65M50 93h55M50 148h61M165 80h55M165 93h65M165 148h56"/>
            <path class="fish" d="M114 116c-14-19-38-20-56-6l-17-11 4 18-4 18 17-11c18 14 42 13 56-6l2-2-2-2Zm-23-4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm130 4c-14-19-38-20-56-6l-17-11 4 18-4 18 17-11c18 14 42 13 56-6l2-2-2-2Zm-23-4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/>
          </svg>
        </section>

        <div class="version-row">
          <span class="pill good">Current: 1.4.0</span><span class="pill">Minecraft 1.21.1</span><span class="pill">Fabric</span><span class="pill">Tide 2.1.1</span><span class="pill">Java 21</span>
        </div>

        <div class="admonition">
          <span></span><span class="admonition-icon">ⓘ</span><div class="admonition-body"><span class="admonition-title">This is a Tide add-on</span><p>Tide remains a separate required mod. This wiki documents everything <strong>Tide Team Journal</strong> adds; use the <a href="https://lightning-64.github.io/tide-wiki/" target="_blank" rel="noreferrer">official Tide wiki</a> for Tide's fish, items, and base fishing mechanics.</p></div>
        </div>

        <h2 id="what-it-adds">What it adds</h2>
        <div class="feature-grid">
          <a class="feature-card" href="#/features/shared-journal"><span class="card-icon">${icon("book")}</span><span class="card-arrow">→</span><h3>One journal per team</h3><p>Discoveries, Fishy Notes, catch totals, first-catch dates, read state, and size records stay in sync.</p></a>
          <a class="feature-card" href="#/features/team-records"><span class="card-icon navy">${icon("chart")}</span><span class="card-arrow">→</span><h3>Team Records</h3><p>A parchment-style screen with completion, four leaderboards, former members, filters, and recent history.</p></a>
          <a class="feature-card" href="#/features/record-holders"><span class="card-icon gold">${icon("trophy")}</span><span class="card-arrow">→</span><h3>Named records</h3><p>Tide's largest and smallest lines show who set them, with safe tools to repair old ownership.</p></a>
          <a class="feature-card" href="#/features/bobber-bonuses"><span class="card-icon purple">${icon("hook")}</span><span class="card-arrow">→</span><h3>Bobbers with a purpose</h3><p>Every Tide bobber gains fishing luck, lure speed, or both—with server-authoritative tooltips.</p></a>
        </div>

        <h2 id="at-a-glance">At a glance</h2>
        <div class="stat-strip"><div class="stat"><strong>4</strong><span>leaderboard metrics</span></div><div class="stat"><strong>4</strong><span>event types</span></div><div class="stat"><strong>200</strong><span>events retained by default</span></div><div class="stat"><strong>10</strong><span>configurable max bonus</span></div></div>
        <p>The shared Tide totals are all-time. Named contributor statistics begin when schema 3 tracking starts, so the mod never invents who caught fish before it could observe them.</p>

        <h2 id="quick-start">Quick start</h2>
        <ol class="steps">
          <li><strong>Install the exact dependencies</strong><span>Put Tide Team Journal and its required mods on the server/host and every connecting client.</span></li>
          <li><strong>Join your world once</strong><span>Your native Tide journal is imported into your personal FTB team, then into your active party when appropriate.</span></li>
          <li><strong>Open Tide's fishing journal</strong><span>Select <em>Team Records</em>, or run <code>/ttj</code>, to view team completion, standings, and history.</span></li>
          <li><strong>Keep fishing normally</strong><span>Tide records catches as usual. The add-on saves the result on the effective FTB team and synchronizes online members.</span></li>
        </ol>
      `
    },

    installation: {
      path: "/getting-started/installation",
      title: "Installation",
      nav: "Installation",
      description: "Required versions, client/server placement, and first-launch checks.",
      keywords: "install dependencies requirements fabric loader cloth config architectury essential",
      body: `
        <span class="eyebrow">Getting started</span><h1>Installation</h1>
        <p class="lead">Tide Team Journal is a required-on-both-sides Fabric mod. Every player and the server—or the Essential host—must use matching versions.</p>

        <h2 id="requirements">Requirements</h2>
        <div class="table-wrap"><table><thead><tr><th>Component</th><th>Required version</th><th>Notes</th></tr></thead><tbody>
          <tr><td><strong>Minecraft</strong></td><td><code>1.21.1</code></td><td>Exact version.</td></tr>
          <tr><td><strong>Java</strong></td><td><code>21+</code></td><td>Needed by Minecraft 1.21.1 and the build.</td></tr>
          <tr><td><strong>Fabric Loader</strong></td><td><code>0.17.0+</code></td><td>Use the Fabric build of every dependency.</td></tr>
          <tr><td><strong>Fabric API</strong></td><td>Compatible 1.21.1 build</td><td>Development uses <code>0.116.0+1.21.1</code>.</td></tr>
          <tr><td><strong>Architectury</strong></td><td><code>13.0.8+</code></td><td>Required by the dependency chain.</td></tr>
          <tr><td><strong>FTB Library</strong></td><td><code>2101.1.30+</code></td><td>Fabric edition.</td></tr>
          <tr><td><strong>FTB Teams</strong></td><td><code>2101.1.10+</code></td><td>Owns personal and party team data.</td></tr>
          <tr><td><strong>Cloth Config</strong></td><td><code>15.0.140+</code></td><td>Provides the in-game client settings screen.</td></tr>
          <tr><td><strong>Tide</strong></td><td><code>2.1.1</code></td><td>Exact version; not bundled.</td></tr>
        </tbody></table></div>

        <h2 id="install-steps">Install steps</h2>
        <ol class="steps">
          <li><strong>Download the runtime JAR</strong><span>Use <code>tide-team-journal-1.4.0.jar</code>. Do not install a file containing <code>sources</code> or <code>dev</code>.</span></li>
          <li><strong>Add every dependency</strong><span>Install Tide 2.1.1, Fabric API, Architectury, FTB Library, FTB Teams, and Cloth Config.</span></li>
          <li><strong>Copy the same set to both sides</strong><span>Dedicated servers need the JARs in the server <code>mods</code> folder. Every player needs them in their client <code>mods</code> folder.</span></li>
          <li><strong>Start the game or server</strong><span>The mod creates its client and server JSON files under <code>config/</code> automatically.</span></li>
        </ol>
        <div class="admonition warning"><span></span><span class="admonition-icon">!</span><div class="admonition-body"><span class="admonition-title">Sources JARs are not mods</span><p>Development archives intentionally omit Fabric metadata. If Fabric Loader does not see Tide Team Journal, check that you installed the ordinary runtime JAR.</p></div></div>

        <h2 id="verify">Verify the install</h2>
        <p>Join a world and run <code>/ttj help</code>. You should see the command list. Open Tide's fishing journal and look for the <strong>Team Records</strong> button near the bottom-right of the book.</p>
        <p>On startup, the log should contain <code>Tide Team Journal initialized</code>. If the team-data path cannot be resolved during an operation, the mod logs a warning and lets Tide use its native personal data path for that operation.</p>

        <h2 id="building">Building from source</h2>
        <p>With Java 21 available, run:</p>
        <pre><code>./gradlew build</code></pre>
        <p>The installable output is written to <code>build/libs/</code>.</p>
      `
    },

    "team-model": {
      path: "/getting-started/team-behavior",
      title: "How teams work",
      nav: "How teams work",
      description: "What happens when players create, join, and leave FTB Teams parties.",
      keywords: "party personal team join leave owner member journal effective team behavior",
      body: `
        <span class="eyebrow">Getting started</span><h1>How teams work</h1>
        <p class="lead">The journal always belongs to the player's <em>effective</em> FTB team: a personal team while solo, or a party team while grouped.</p>

        <div class="flow"><div class="flow-node"><strong>Solo player</strong><span>Personal FTB team journal</span></div><span class="flow-arrow">→</span><div class="flow-node"><strong>Joins a party</strong><span>One-time import into party</span></div><span class="flow-arrow">→</span><div class="flow-node"><strong>Party play</strong><span>Everyone sees the shared journal</span></div></div>

        <h2 id="solo-players">Solo players</h2>
        <p>A solo player's journal is stored on their personal FTB team. The first time the mod encounters that player, it imports their existing native Tide data and attributes safely identifiable personal size records to them.</p>

        <h2 id="creating-a-party">Creating a party</h2>
        <p>FTB Teams copies the owner's extra team data into a new party. That means a newly created party starts with its owner's personal Tide Team Journal rather than an empty book.</p>

        <h2 id="joining-a-party">Joining an existing party</h2>
        <p>On first join, the player's personal journal is imported into the party:</p>
        <ul>
          <li>discoveries, unread flags, Fishy Notes, and <code>gotJournal</code> are combined;</li>
          <li>catch totals are added when the player is known not to have been imported before;</li>
          <li>the earliest first-catch date, largest catch, and smallest catch are preserved;</li>
          <li>tracked contributor data and unique history events are merged once.</li>
        </ul>
        <p>The player's UUID is added to the party's imported-members set, preventing repeated catch-count merges after a restart or reconnect.</p>

        <h2 id="leaving-a-party">Leaving a party</h2>
        <p>The party keeps its journal and record history. The departing player returns to their personal team journal. The mod does not copy all party progress back into the personal journal when they leave.</p>
        <div class="admonition tip"><span></span><span class="admonition-icon">✓</span><div class="admonition-body"><span class="admonition-title">Former members remain in standings</span><p>Contribution records are retained and marked <em>(former)</em>. Each client can choose whether to display former members.</p></div></div>

        <h2 id="live-sync">Live synchronization</h2>
        <p>After a successful save, the full team journal and record-holder metadata are sent to all online members of the team. Login and team-change events also trigger a fresh synchronization. Offline players receive the current journal the next time they connect.</p>
      `
    },

    "shared-journal": {
      path: "/features/shared-journal",
      title: "Shared fishing journal",
      nav: "Shared fishing journal",
      description: "Exactly which Tide journal facts are shared and how merge conflicts are resolved.",
      keywords: "journal discoveries fishy notes catch totals first date unread gotJournal merge stats",
      body: `
        <span class="eyebrow">Features</span><h1>Shared fishing journal</h1>
        <p class="lead">Party members use Tide's normal journal screen, but the facts inside it come from one team-owned journal.</p>

        <h2 id="shared-data">What is shared</h2>
        <div class="table-wrap"><table><thead><tr><th>Journal fact</th><th>Merge behavior</th></tr></thead><tbody>
          <tr><td><strong>Fish discovery</strong></td><td>Unlocked if any imported journal unlocked it.</td></tr>
          <tr><td><strong>Unread state</strong></td><td>Unread if either journal still marks the profile unread; reading updates the shared state.</td></tr>
          <tr><td><strong>Fishy Note</strong></td><td>Kept if any imported journal has the note.</td></tr>
          <tr><td><strong>Journal obtained</strong></td><td>Tide's <code>gotJournal</code> flag is shared.</td></tr>
          <tr><td><strong>Catch total</strong></td><td>Normally summed once during a verified new import; conservative repairs keep the larger total.</td></tr>
          <tr><td><strong>First catch</strong></td><td>The earliest real-time date/game timestamp wins.</td></tr>
          <tr><td><strong>Largest catch</strong></td><td>The greater measurement wins.</td></tr>
          <tr><td><strong>Smallest catch</strong></td><td>The smaller measurement wins.</td></tr>
        </tbody></table></div>

        <h2 id="normal-use">Normal use</h2>
        <p>No replacement journal item is added. Open and use Tide's fishing journal exactly as before. Catch logging, Fishy Notes, page discovery, read state, and profile statistics are intercepted at Tide's normal data boundary and saved to the effective FTB team.</p>

        <h2 id="named-lines">Named record lines</h2>
        <p>On fish profiles, Tide's standard statistics block is replaced with an equivalent team-aware block. When ownership is known, record lines read like:</p>
        <div class="record-demo"><div class="record-line">Largest: 42.7 cm — <b>Alex</b></div><div class="record-line">Smallest: 11.2 cm — <b>Sam</b></div></div>
        <p>Long names automatically scale down only when the text would exceed the stats column. Unknown legacy owners keep Tide's ordinary line, without a guessed name.</p>

        <h2 id="safety">Failure safety</h2>
        <p>Team data is stored in FTB Teams extra data under the mod's own namespace. If the team journal cannot be resolved or saved for a particular operation, the mod logs the problem and falls back to Tide's native load/save behavior where possible.</p>
      `
    },

    "team-records": {
      path: "/features/team-records",
      title: "Team Records",
      nav: "Team Records & standings",
      description: "Summary, leaderboards, history, filters, paging, and contribution tracking.",
      keywords: "summary leaderboard history catches species records active contributors former tracking epoch filter",
      body: `
        <span class="eyebrow">Features</span><h1>Team Records & standings</h1>
        <p class="lead">A dedicated, Tide-styled record book turns the shared journal into a team scorecard without changing Minecraft's scoreboard system.</p>

        <h2 id="opening">Opening Team Records</h2>
        <p>Use the <strong>Team Records</strong> button in Tide's journal, or run <code>/ttj</code> or <code>/ttj open</code>. The button can be hidden per client; the command remains available.</p>

        <h2 id="summary">Summary tab</h2>
        <p>The Summary tab shows:</p>
        <ul><li>journal completion as discovered species out of all available Tide journal entries;</li><li>shared all-time catch count;</li><li>the number of tracked contributors;</li><li>the date and time named contribution tracking began;</li><li>up to five recent event highlights.</li></ul>

        <h2 id="leaderboards">Leaderboard tab</h2>
        <div class="table-wrap"><table><thead><tr><th>Metric</th><th>Meaning</th></tr></thead><tbody>
          <tr><td><code>catches</code></td><td>Catches observed for that contributor since tracking began.</td></tr>
          <tr><td><code>species</code></td><td>Distinct species the contributor has caught since tracking began.</td></tr>
          <tr><td><code>record_events</code></td><td>Tracked first-discovery, new-largest, and new-smallest events caused by that player.</td></tr>
          <tr><td><code>active_records</code></td><td>Largest and smallest record slots the player currently owns. A species can contribute two.</td></tr>
        </tbody></table></div>
        <p>The screen shows eight contributors per page; chat commands show ten. Ties are ordered by name. Former party members remain labeled and can be hidden in client settings.</p>

        <h2 id="history">History tab</h2>
        <p>History is newest-first and paged eight events at a time in the GUI. Filter it by an exact fish item ID such as <code>tide:rainbow_trout</code>, or cycle through all events, first discoveries, largest records, smallest records, and ownership repairs.</p>
        <p>The default retention limit is 200 entries, configurable from 0 to 10,000. Lowering the limit on reload immediately removes the oldest excess entries.</p>

        <h2 id="tracking-epoch">All-time totals vs. named contributions</h2>
        <div class="admonition"><span></span><span class="admonition-icon">ⓘ</span><div class="admonition-body"><span class="admonition-title">Two intentionally different timelines</span><p>The journal's completion and total catches remain all-time. Contributor standings and event history begin with schema 3 tracking, because older shared catches cannot be assigned to a person reliably.</p></div></div>
        <p>Disabling leaderboard or history visibility does not erase counters. Disabling <code>contributionTracking</code> stops new contribution counters and catch events until re-enabled.</p>

        <h2 id="offline">Online and offline behavior</h2>
        <p>Catch alerts are broadcast only to currently online teammates. The event itself remains in team history, so players who were offline can review it later.</p>
      `
    },

    "record-holders": {
      path: "/features/record-holders",
      title: "Record ownership",
      nav: "Record ownership",
      description: "Automatic attribution, exact-fish claims, officer assignment, and active records.",
      keywords: "largest smallest holder claim assign exact fish officer owner repair ownership",
      body: `
        <span class="eyebrow">Features</span><h1>Record ownership</h1>
        <p class="lead">The mod records who owns each largest and smallest team record, and updates ownership from exact before/after catch snapshots.</p>

        <h2 id="automatic">Automatic attribution</h2>
        <p>When a catch creates a species' first sized statistic, the catcher receives both largest and smallest ownership. Later catches replace only the record they actually beat. Ownership metadata is resynchronized to online teammates immediately.</p>
        <p>If Tide resets a fish's journal statistics, stale ownership for that fish is also removed.</p>

        <h2 id="legacy">Legacy records</h2>
        <p>Personal legacy records can be attributed during a safe personal import. A pre-existing shared party record with no defensible owner remains unnamed until somebody beats it or an authorized player repairs it.</p>
        <div class="admonition warning"><span></span><span class="admonition-icon">!</span><div class="admonition-body"><span class="admonition-title">No guessing</span><p>Version 1.4 starts a new named-tracking epoch. It does not award old shared records to the party owner or the first member who logs in.</p></div></div>

        <h2 id="member-claim">Member claims with proof</h2>
        <p>With <code>membersMayClaimWithExactFish</code> enabled, an ordinary member may hold the physical fish whose stored Tide length exactly matches the current team record and run:</p>
        <div class="command"><code>/ttj claim largest</code><span>Claim the held species' largest record.</span></div>
        <div class="command"><code>/ttj claim smallest</code><span>Claim the held species' smallest record.</span></div>
        <p>Matching uses a very small floating-point tolerance; the fish must be the actual record measurement. Officers who meet the configured repair rank do not need exact-fish proof for their own claim.</p>

        <h2 id="officer-repair">Officer assignment</h2>
        <p>By default, FTB Teams officers and owners can hold any fish of the relevant species and assign a single record to an online current member:</p>
        <div class="command"><code>/ttj assign largest &lt;member&gt;</code><span>Assign the current largest slot.</span></div>
        <div class="command"><code>/ttj assign smallest &lt;member&gt;</code><span>Assign the current smallest slot.</span></div>
        <p>Party owners—or officers if the server changes <code>claimAllMinimumRank</code>—can assign both records for every sized species with <code>/ttj claimall [member]</code>.</p>

        <h2 id="repair-history">Repair events</h2>
        <p>Claims and assignments append ownership-repair history when <code>trackRepairs</code> is enabled. The history entry stores the actor, target, fish ID, current record size, wall-clock timestamp, and game time.</p>
      `
    },

    "alerts-markers": {
      path: "/features/alerts-and-markers",
      title: "Alerts & fish markers",
      nav: "Alerts & fish markers",
      description: "Catch announcements, HUD cards, inventory record badges, tooltips, and rarity stars.",
      keywords: "toast hud chat announcement badge tooltip rarity stars largest smallest fish bucket",
      body: `
        <span class="eyebrow">Features</span><h1>Alerts & fish markers</h1>
        <p class="lead">Important team catches are visible in the moment, while physical record fish remain easy to recognize later.</p>

        <h2 id="events">Catch events</h2>
        <p>Four kinds of notable event are understood:</p>
        <div class="table-wrap"><table><thead><tr><th>Event</th><th>When it occurs</th><th>Accent</th></tr></thead><tbody>
          <tr><td><strong>First Discovery</strong></td><td>The team's first sized catch for a species.</td><td><span class="swatch" style="background:#4f7771"></span>Teal</td></tr>
          <tr><td><strong>New Largest</strong></td><td>A catch exceeds the existing largest measurement.</td><td><span class="swatch" style="background:#9a7044"></span>Gold-brown</td></tr>
          <tr><td><strong>New Smallest</strong></td><td>A catch is below the existing smallest measurement.</td><td><span class="swatch" style="background:#765f72"></span>Purple</td></tr>
          <tr><td><strong>Ownership Repair</strong></td><td>A claim or assignment changes attribution.</td><td><span class="swatch" style="background:#79695d"></span>Stone</td></tr>
        </tbody></table></div>

        <h2 id="hud">HUD and chat announcement</h2>
        <p>When server announcements are enabled, every online team member receives a short parchment-style HUD card. It slides in at the right side, shows the event, catcher, fish, length, and—when applicable—the improvement over the old record. The same event is added as a compact chat line. A level-up sound plays if enabled.</p>
        <p>The card lasts 5 seconds by default and can be set from 2 to 20 seconds per client. Colors for discovery, largest, and smallest events are customizable.</p>
        <div class="admonition warning"><span></span><span class="admonition-icon">!</span><div class="admonition-body"><span class="admonition-title">Version 1.4.0 setting note</span><p>The client UI stores <code>toastMode</code> as <code>full</code>, <code>compact</code>, or <code>off</code>, but the current renderer does not branch on that value. Duration, sound, and colors work; mode selection currently has no effect.</p></div></div>

        <h2 id="badges">Inventory record badges</h2>
        <p>A physical fish stack whose stored Tide length matches a current team record receives a corner badge without modifying the item:</p>
        <ul><li>a gold <strong>L</strong> in the upper-left for largest;</li><li>a purple <strong>S</strong> in the upper-right for smallest;</li><li>both letters when one fish holds both records.</li></ul>
        <p>Client and server settings must both allow badges. Because they are rendered from synchronized team data, ownership changes and new records update the marker automatically.</p>

        <h2 id="tooltips">Tooltips and rarity</h2>
        <p>Matching record fish receive bold tooltip lines naming the largest/smallest status and formatted measurement. The server can globally disable these record lines, and each player can hide them.</p>
        <p>The add-on also appends Tide rarity and star count to every recognized fish item or fish bucket tooltip. Rarity display is always enabled in the current version and is independent of the record-tooltip toggle.</p>
      `
    },

    "bobber-bonuses": {
      path: "/features/bobber-bonuses",
      title: "Bobber bonuses",
      nav: "Bobber bonuses",
      description: "All default luck and lure-speed values, fallback behavior, and datapack support.",
      keywords: "bobber fishing luck lure speed colored iron golden diamond netherite echo feather tooltip datapack",
      body: `
        <span class="eyebrow">Features</span><h1>Bobber bonuses</h1>
        <p class="lead">Bobbers in Tide's <code>tide:bobbers</code> item tag become functional rod upgrades. Their configured values are added when Tide creates the fishing hook.</p>

        <h2 id="how-it-works">How it works</h2>
        <p>The server resolves the rod's installed bobber and adds its bonus to Tide's existing fishing luck and lure speed. Values stack with the rod's other effects. Tooltips use the server-synchronized table, so what a player sees matches what the cast receives.</p>
        <div class="admonition"><span></span><span class="admonition-icon">ⓘ</span><div class="admonition-body"><span class="admonition-title">Third-party bobbers are supported</span><p>Any item added to <code>tide:bobbers</code> by a datapack or mod gets the fallback bonus unless its exact item ID appears in <code>bobberBonuses</code>.</p></div></div>

        <h2 id="default-table">Default bonus table</h2>
        <div class="table-wrap"><table><thead><tr><th>Bobber</th><th>Fishing luck</th><th>Lure speed</th></tr></thead><tbody>
          <tr><td><strong>16 colored bobbers</strong><br><small>red, orange, yellow, lime, green, cyan, light blue, blue, purple, magenta, pink, white, light gray, gray, black, brown</small></td><td><span class="bonus"><b>+0</b></span></td><td><span class="bonus speed"><b>+1</b></span></td></tr>
          <tr><td><code>golden_apple_bobber</code></td><td><span class="bonus"><b>+1</b></span></td><td><span class="bonus speed"><b>+1</b></span></td></tr>
          <tr><td><code>enchanted_golden_apple_bobber</code></td><td><span class="bonus"><b>+2</b></span></td><td><span class="bonus speed"><b>+2</b></span></td></tr>
          <tr><td><code>iron_bobber</code></td><td><span class="bonus"><b>+0</b></span></td><td><span class="bonus speed"><b>+2</b></span></td></tr>
          <tr><td><code>golden_bobber</code></td><td><span class="bonus"><b>+2</b></span></td><td><span class="bonus speed"><b>+0</b></span></td></tr>
          <tr><td><code>diamond_bobber</code></td><td><span class="bonus"><b>+1</b></span></td><td><span class="bonus speed"><b>+2</b></span></td></tr>
          <tr><td><code>netherite_bobber</code></td><td><span class="bonus"><b>+2</b></span></td><td><span class="bonus speed"><b>+2</b></span></td></tr>
          <tr><td><code>amethyst_bobber</code></td><td><span class="bonus"><b>+2</b></span></td><td><span class="bonus speed"><b>+0</b></span></td></tr>
          <tr><td><code>echo_bobber</code></td><td><span class="bonus"><b>+0</b></span></td><td><span class="bonus speed"><b>+3</b></span></td></tr>
          <tr><td><code>chorus_bobber</code></td><td><span class="bonus"><b>+1</b></span></td><td><span class="bonus speed"><b>+1</b></span></td></tr>
          <tr><td><code>feather_bobber</code></td><td><span class="bonus"><b>+0</b></span></td><td><span class="bonus speed"><b>+3</b></span></td></tr>
          <tr><td><code>lichen_bobber</code></td><td><span class="bonus"><b>+0</b></span></td><td><span class="bonus speed"><b>+2</b></span></td></tr>
          <tr><td><code>nautilus_bobber</code></td><td><span class="bonus"><b>+2</b></span></td><td><span class="bonus speed"><b>+0</b></span></td></tr>
          <tr><td><code>pearl_bobber</code></td><td><span class="bonus"><b>+1</b></span></td><td><span class="bonus speed"><b>+2</b></span></td></tr>
          <tr><td><code>heart_bobber</code></td><td><span class="bonus"><b>+3</b></span></td><td><span class="bonus speed"><b>+0</b></span></td></tr>
          <tr><td><code>grassy_bobber</code></td><td><span class="bonus"><b>+1</b></span></td><td><span class="bonus speed"><b>+1</b></span></td></tr>
          <tr><td><code>duck_bobber</code></td><td><span class="bonus"><b>+0</b></span></td><td><span class="bonus speed"><b>+2</b></span></td></tr>
          <tr><td><strong>Fallback / all other tagged bobbers</strong></td><td><span class="bonus"><b>+0</b></span></td><td><span class="bonus speed"><b>+1</b></span></td></tr>
        </tbody></table></div>

        <h2 id="customizing">Customizing bonuses</h2>
        <p>Edit <code>config/tide_team_journal-server.json</code>. Each exact item entry accepts <code>luck</code> and <code>lureSpeed</code> integers. Values are clamped to 0–10. Apply and synchronize the new table without restarting:</p>
        <pre><code>/ttj config reload</code></pre>
        <p>Set <code>bobberBonusesEnabled</code> to <code>false</code> to remove all added effects and tooltip lines.</p>
      `
    },

    commands: {
      path: "/reference/commands",
      title: "Commands",
      nav: "Commands",
      description: "Complete /ttj command list, arguments, pages, and permission requirements.",
      keywords: "ttj tideteamjournal command help open leaderboard history member merge claim assign status reload permissions",
      body: `
        <span class="eyebrow">Reference</span><h1>Commands</h1>
        <p class="lead">Every command is available under both <code>/ttj</code> and <code>/tideteamjournal</code>. Page arguments are one-based.</p>

        <h2 id="everyone">Available to everyone</h2>
        <div class="table-wrap"><table><thead><tr><th>Command</th><th>Purpose</th></tr></thead><tbody>
          <tr><td><code>/ttj</code><br><code>/ttj open</code></td><td>Open the Team Records screen.</td></tr>
          <tr><td><code>/ttj help</code></td><td>Print the built-in command summary.</td></tr>
          <tr><td><code>/ttj leaderboard [metric] [page]</code></td><td>Show ten ranked contributors. Default metric is <code>catches</code>; valid metrics are <code>catches</code>, <code>species</code>, <code>record_events</code>, and <code>active_records</code>, subject to server visibility.</td></tr>
          <tr><td><code>/ttj history [page]</code></td><td>Show the team's event history in chat.</td></tr>
          <tr><td><code>/ttj history fish &lt;fish_id&gt; [page]</code></td><td>Show history for one exact item ID.</td></tr>
          <tr><td><code>/ttj member &lt;name-or-uuid&gt;</code></td><td>Show one tracked contributor's catches, species, record events, and active records. UUID resolves duplicate names.</td></tr>
          <tr><td><code>/ttj merge</code></td><td>Idempotently reapply missing personal journal facts to the active party using conservative counts.</td></tr>
          <tr><td><code>/ttj claim largest</code></td><td>Claim the held species' largest record. Ordinary members need the exact record fish by default.</td></tr>
          <tr><td><code>/ttj claim smallest</code></td><td>Claim the held species' smallest record under the same proof rule.</td></tr>
          <tr><td><code>/ttj status</code></td><td>Show the server's largest/smallest owner names for the held fish species and resynchronize client metadata.</td></tr>
        </tbody></table></div>

        <h2 id="ranked">Rank-gated commands</h2>
        <div class="table-wrap"><table><thead><tr><th>Command</th><th>Default requirement</th><th>Purpose</th></tr></thead><tbody>
          <tr><td><code>/ttj assign &lt;largest|smallest&gt; &lt;online-member&gt;</code></td><td>Officer</td><td>Assign one current record for the held species to a current party member.</td></tr>
          <tr><td><code>/ttj claimall [online-member]</code></td><td>Party owner</td><td>Assign both largest and smallest ownership across every species with sized stats.</td></tr>
          <tr><td><code>/ttj config reload</code></td><td>Server permission level 2</td><td>Validate and hot-reload the server JSON, trim histories, and synchronize bobber/badge rules.</td></tr>
        </tbody></table></div>
        <p>With <code>operatorBypass</code> enabled, permission-level-2 operators satisfy the rank checks for claim/repair commands. The reload command itself always requires permission level 2.</p>

        <h2 id="availability">Feature availability</h2>
        <p>If the server disables leaderboard visibility, history visibility, or a leaderboard metric, its related command returns “That Team Journal feature is disabled by the server.” Hidden data is retained unless tracking or retention is changed separately.</p>
      `
    },

    "client-config": {
      path: "/reference/client-configuration",
      title: "Client configuration",
      nav: "Client configuration",
      description: "Every personal presentation setting and its default value.",
      keywords: "client config json badge tooltip button former default tab metric toast duration sound color cloth",
      body: `
        <span class="eyebrow">Reference</span><h1>Client configuration</h1>
        <p class="lead">Personal presentation settings live in <code>config/tide_team_journal-client.json</code> and are editable from the Team Records <strong>Settings</strong> button.</p>

        <h2 id="display">Display settings</h2>
        <div class="table-wrap"><table><thead><tr><th>JSON key</th><th>Default</th><th>Effect</th></tr></thead><tbody>
          <tr><td><code>showRecordBadges</code></td><td><code>true</code></td><td>Show L/S overlays on physical record fish, if the server allows them.</td></tr>
          <tr><td><code>showRecordTooltips</code></td><td><code>true</code></td><td>Show largest/smallest record lines in fish tooltips, if the server allows them.</td></tr>
          <tr><td><code>showTeamRecordsButton</code></td><td><code>true</code></td><td>Show the Team Records button in Tide's journal.</td></tr>
          <tr><td><code>showFormerMembers</code></td><td><code>true</code></td><td>Include departed contributors in the GUI leaderboard.</td></tr>
          <tr><td><code>defaultTab</code></td><td><code>summary</code></td><td>Initial screen: <code>summary</code>, <code>leaderboard</code>, or <code>history</code>.</td></tr>
          <tr><td><code>defaultMetric</code></td><td><code>catches</code></td><td>Initial metric: <code>catches</code>, <code>species</code>, <code>record_events</code>, or <code>active_records</code>.</td></tr>
        </tbody></table></div>

        <h2 id="alerts">Record alert settings</h2>
        <div class="table-wrap"><table><thead><tr><th>JSON key</th><th>Default</th><th>Validation / effect</th></tr></thead><tbody>
          <tr><td><code>toastMode</code></td><td><code>full</code></td><td>Accepts <code>full</code>, <code>compact</code>, or <code>off</code>. In 1.4.0 the stored value is not yet used by the renderer.</td></tr>
          <tr><td><code>toastDurationSeconds</code></td><td><code>5</code></td><td>HUD lifetime; clamped to 2–20 seconds.</td></tr>
          <tr><td><code>toastSound</code></td><td><code>true</code></td><td>Play the level-up alert sound.</td></tr>
          <tr><td><code>largestColor</code></td><td><span class="swatch" style="background:#9a7044"></span><code>#9A7044</code></td><td>Largest-record accent, calmed toward the parchment palette for the HUD.</td></tr>
          <tr><td><code>smallestColor</code></td><td><span class="swatch" style="background:#765f72"></span><code>#765F72</code></td><td>Smallest-record accent.</td></tr>
          <tr><td><code>discoveryColor</code></td><td><span class="swatch" style="background:#4f7771"></span><code>#4F7771</code></td><td>First-discovery accent.</td></tr>
        </tbody></table></div>
        <p>The color fields are stored as decimal RGB integers by JSON. Old neon defaults from an earlier release are migrated to the calmer v1.4 palette; custom colors are preserved.</p>

        <h2 id="server-interaction">Server interaction</h2>
        <p>Badges and record tooltips require both the personal setting and the corresponding server policy to be enabled. The server's effective rules are synchronized at login and after <code>/ttj config reload</code>.</p>
      `
    },

    "server-config": {
      path: "/reference/server-configuration",
      title: "Server configuration",
      nav: "Server configuration",
      description: "Every server rule, validation behavior, and hot-reload detail.",
      keywords: "server config json leaderboard history tracking announcements badge tooltip operator claim rank retention event bobber reload validation",
      body: `
        <span class="eyebrow">Reference</span><h1>Server configuration</h1>
        <p class="lead">World-authoritative rules live in <code>config/tide_team_journal-server.json</code>. Invalid reloads preserve the previous valid configuration.</p>

        <h2 id="features">Features and visibility</h2>
        <div class="table-wrap"><table><thead><tr><th>JSON key</th><th>Default</th><th>Effect</th></tr></thead><tbody>
          <tr><td><code>leaderboardEnabled</code></td><td><code>true</code></td><td>Expose leaderboard views and commands. Does not erase counters.</td></tr>
          <tr><td><code>historyEnabled</code></td><td><code>true</code></td><td>Expose event history. Does not erase retained events.</td></tr>
          <tr><td><code>contributionTracking</code></td><td><code>true</code></td><td>Count new catches/species and generate catch-derived events.</td></tr>
          <tr><td><code>announcementsEnabled</code></td><td><code>true</code></td><td>Broadcast new tracked events to online teammates.</td></tr>
          <tr><td><code>recordBadgesEnabled</code></td><td><code>true</code></td><td>Globally permit physical-fish inventory badges.</td></tr>
          <tr><td><code>recordTooltipsEnabled</code></td><td><code>true</code></td><td>Globally permit largest/smallest tooltip lines.</td></tr>
          <tr><td><code>historyLimit</code></td><td><code>200</code></td><td>Maximum retained events; clamped to 0–10,000. Zero stores none.</td></tr>
          <tr><td><code>visibleMetrics</code></td><td>all four</td><td>Allowed values: <code>catches</code>, <code>species</code>, <code>record_events</code>, <code>active_records</code>. Invalid/empty lists revert to all four.</td></tr>
        </tbody></table></div>

        <h2 id="events">Event-type tracking</h2>
        <div class="table-wrap"><table><thead><tr><th>JSON key</th><th>Default</th><th>Controls</th></tr></thead><tbody>
          <tr><td><code>trackDiscoveries</code></td><td><code>true</code></td><td>First team discovery history and announcement events.</td></tr>
          <tr><td><code>trackLargestRecords</code></td><td><code>true</code></td><td>New-largest history and announcement events.</td></tr>
          <tr><td><code>trackSmallestRecords</code></td><td><code>true</code></td><td>New-smallest history and announcement events.</td></tr>
          <tr><td><code>trackRepairs</code></td><td><code>true</code></td><td>Ownership repair history. Repairs still change ownership when disabled.</td></tr>
        </tbody></table></div>

        <h2 id="permissions">Claim and repair permissions</h2>
        <div class="table-wrap"><table><thead><tr><th>JSON key</th><th>Default</th><th>Validation / effect</th></tr></thead><tbody>
          <tr><td><code>operatorBypass</code></td><td><code>true</code></td><td>Permission-level-2 operators satisfy party rank checks.</td></tr>
          <tr><td><code>membersMayClaimWithExactFish</code></td><td><code>true</code></td><td>Ordinary members may claim a record by holding exact measurement proof.</td></tr>
          <tr><td><code>repairMinimumRank</code></td><td><code>officer</code></td><td><code>officer</code> or <code>owner</code>; every other value becomes <code>officer</code>.</td></tr>
          <tr><td><code>claimAllMinimumRank</code></td><td><code>owner</code></td><td><code>owner</code> or <code>officer</code>; every other value becomes <code>owner</code>.</td></tr>
        </tbody></table></div>

        <h2 id="bobbers">Bobber rules</h2>
        <div class="table-wrap"><table><thead><tr><th>JSON key</th><th>Default</th><th>Effect</th></tr></thead><tbody>
          <tr><td><code>bobberBonusesEnabled</code></td><td><code>true</code></td><td>Master switch for added luck/lure speed and their tooltip lines.</td></tr>
          <tr><td><code>fallbackBobberBonus</code></td><td><code>{ luck: 0, lureSpeed: 1 }</code></td><td>Used by tagged bobbers without an exact override.</td></tr>
          <tr><td><code>bobberBonuses</code></td><td>Built-in table</td><td>Map from item ID to <code>luck</code>/<code>lureSpeed</code>. Each value is clamped to 0–10; invalid IDs are ignored with a warning.</td></tr>
        </tbody></table></div>

        <h2 id="reload">Hot reload</h2>
        <pre><code>/ttj config reload</code></pre>
        <p>Reloading validates the file, applies it without restarting, trims every team history to the new limit, and synchronizes effective bobber, badge, and tooltip settings to online players. Malformed JSON or an empty configuration leaves the last valid settings active.</p>
      `
    },

    "migration-repairs": {
      path: "/administration/migration-and-repairs",
      title: "Migration & repairs",
      nav: "Migration & repairs",
      description: "Safe native Tide import, schema upgrades, conservative merges, and ownership repair workflows.",
      keywords: "migration import legacy schema 3 merge duplicate repair backfill reset conservative",
      body: `
        <span class="eyebrow">Administration</span><h1>Migration & repairs</h1>
        <p class="lead">Migration is intentionally conservative: preserve every defensible journal fact, avoid duplicating catch totals, and never fabricate record owners.</p>

        <h2 id="native-import">Native Tide import</h2>
        <p>The first time a player's personal FTB team is initialized, the mod copies their native <code>TidePlayerData</code>. Their known personal largest/smallest records can be backfilled to their identity. A legacy-import flag prevents repeating this work.</p>

        <h2 id="existing-parties">Existing parties</h2>
        <p>When installing into a world that already has parties, each member contributes their saved personal journal as they log in. Imported UUIDs are persisted on the party. Until each member has joined once, that person's old personal data cannot be included.</p>

        <h2 id="schema-upgrades">Schema 1 → 3 safeguards</h2>
        <p>Parties upgraded from the original release record current members as legacy import candidates. Before adding an old personal catch total, the mod checks whether all of that player's facts are already represented by the team journal. If so, it marks the member imported without adding the same catch history again.</p>
        <div class="table-wrap"><table><thead><tr><th>Fact</th><th>“Already represented” test</th></tr></thead><tbody>
          <tr><td>Flags</td><td>Team already has every unlock, unread flag, Fishy Note, and journal flag present personally.</td></tr>
          <tr><td>Catches</td><td>Team count is at least the personal count.</td></tr>
          <tr><td>First catch</td><td>Team date is the same or earlier.</td></tr>
          <tr><td>Largest / smallest</td><td>Team largest is at least as large and team smallest is at most as small.</td></tr>
        </tbody></table></div>

        <h2 id="manual-merge">Manual merge</h2>
        <p>Inside a party, <code>/ttj merge</code> reapplies missing personal facts. It is safe to repeat:</p>
        <ul><li>flags use logical OR;</li><li>catch totals use the greater existing value instead of addition;</li><li>the earliest date, greatest largest, and least smallest are kept;</li><li>record ownership is imported only when its matching measurement wins or a tied record has no owner.</li></ul>
        <p>The command reports whether anything changed, whether the personal journal was already represented, or whether the player is not in a party.</p>

        <h2 id="ownership-workflow">Ownership repair workflow</h2>
        <ol class="steps">
          <li><strong>Inspect the held species</strong><span>Run <code>/ttj status</code> to see server owner names and refresh the client cache.</span></li>
          <li><strong>Prefer exact proof</strong><span>If the original record fish still exists, its owner can hold it and use <code>/ttj claim</code>.</span></li>
          <li><strong>Use officer assignment for legacy gaps</strong><span>An officer holds any fish of the species and assigns the record to an online current member.</span></li>
          <li><strong>Use bulk assignment only when justified</strong><span><code>/ttj claimall</code> overwrites both record holders across every sized species and is owner-only by default.</span></li>
        </ol>
        <div class="admonition danger"><span></span><span class="admonition-icon">!</span><div class="admonition-body"><span class="admonition-title">Bulk assignment is intentionally powerful</span><p><code>claimall</code> does not infer historical ownership; it deliberately assigns all current record slots to the chosen member. Use it only for a known migration or repair case.</p></div></div>
      `
    },

    hosting: {
      path: "/administration/hosting",
      title: "Hosting & multiplayer",
      nav: "Hosting & multiplayer",
      description: "Dedicated servers, Essential worlds, synchronization, and config ownership.",
      keywords: "dedicated server essential host multiplayer mods folder online offline synchronization config",
      body: `
        <span class="eyebrow">Administration</span><h1>Hosting & multiplayer</h1>
        <p class="lead">The active server owns all team journal data and policy. Clients render the screens, tooltips, badges, and alerts from synchronized snapshots.</p>

        <h2 id="dedicated">Dedicated servers</h2>
        <p>Install Tide Team Journal and every dependency on the server and all clients. The server's <code>config/tide_team_journal-server.json</code> is authoritative. Each client keeps its own presentation file.</p>

        <h2 id="essential">Essential-hosted worlds</h2>
        <p>Install the runtime JAR and dependencies in the host's and every joining player's <code>mods</code> folder. The host's integrated server owns the FTB Teams extra data and server configuration.</p>
        <div class="admonition tip"><span></span><span class="admonition-icon">✓</span><div class="admonition-body"><span class="admonition-title">Have every existing teammate join once</span><p>Legacy personal journals can only be imported when their owner connects. Keep the host online until each existing member has joined and received the shared journal.</p></div></div>

        <h2 id="data-owner">Where data lives</h2>
        <p>The journal, imported-member set, record owners, contributor counters, tracking start time, and event history live inside FTB Teams extra data for the personal or party team. They are not stored in the client configuration files.</p>

        <h2 id="network">Synchronization</h2>
        <ul>
          <li>Tide journal data and record holders synchronize after saves, logins, team changes, claims, and repairs.</li>
          <li>Team Records requests fetch a server-built snapshot for the selected page, metric, fish filter, and event type.</li>
          <li>Bobber tables and server badge/tooltip policies synchronize at login and config reload.</li>
          <li>Live event announcements go only to online members; retained history covers missed events.</li>
        </ul>
      `
    },

    faq: {
      path: "/administration/faq",
      title: "FAQ & troubleshooting",
      nav: "FAQ & troubleshooting",
      description: "Common questions, known v1.4 behavior, and practical recovery checks.",
      keywords: "faq troubleshooting missing button empty journal duplicate catches record owner toast mode error",
      body: `
        <span class="eyebrow">Administration</span><h1>FAQ & troubleshooting</h1>

        <h2 id="button-missing">The Team Records button is missing</h2>
        <p>Check <code>showTeamRecordsButton</code> in the client configuration. You can still run <code>/ttj</code>. If the command cannot open the screen, confirm that the runtime mod and matching version are installed on that client.</p>

        <h2 id="journal-missing">A teammate's old catches are missing</h2>
        <p>That teammate must join once after installation so the server can read and import their personal journal. If they are online and inside the party, have them run <code>/ttj merge</code> to conservatively reapply missing facts.</p>

        <h2 id="duplicate">Will reconnecting duplicate catches?</h2>
        <p>No. Each party stores imported member UUIDs, and upgrade candidates use an inclusion test before totals are added. Manual merge uses maximum counts rather than addition.</p>

        <h2 id="unnamed-record">Why is an old record unnamed?</h2>
        <p>The mod could not attribute it safely. This is expected for legacy shared records. The next player to beat it becomes the owner automatically, or an officer can repair it with <code>/ttj assign</code>.</p>

        <h2 id="markers">Why does a fish not show L or S?</h2>
        <ul><li>Confirm both client and server badge settings are enabled.</li><li>The stack needs finite, positive Tide length data.</li><li>Its item type must resolve as a Tide fish.</li><li>The stored length must match the current synchronized team record.</li><li>Run <code>/ttj status</code> while holding the species to refresh record metadata.</li></ul>

        <h2 id="alerts-off">Why does “Catch alert detail: off” still show alerts?</h2>
        <p>In v1.4.0, <code>toastMode</code> is validated and saved but not read by the current HUD renderer. The server-wide <code>announcementsEnabled</code> switch works. Client duration, sound, and accent color settings also work.</p>

        <h2 id="invalid-config">The server config did not reload</h2>
        <p>The loader is fail-safe: malformed JSON or an empty root keeps the last valid in-memory settings. Review the server log for the parsing error, fix the file, then run <code>/ttj config reload</code> again. Invalid bobber item IDs are skipped individually with warnings.</p>

        <h2 id="history-empty">History is empty but totals are not</h2>
        <p>All-time Tide totals predate named tracking, while history starts at the schema 3 tracking epoch. Also check <code>historyEnabled</code>, <code>contributionTracking</code>, individual event toggles, and <code>historyLimit</code>. A zero limit intentionally stores no events.</p>

        <h2 id="leaving">What happens when somebody leaves?</h2>
        <p>The party keeps the shared journal and history. The player returns to their personal journal. Their contributor row remains as a former member and can be hidden per client.</p>
      `
    }
  }
};

function icon(name) {
  const paths = {
    book: '<path d="M4 5.5c3.2-1.4 5.8-1 8 1.1 2.2-2.1 4.8-2.5 8-1.1v13c-3.2-1.4-5.8-1-8 1.1-2.2-2.1-4.8-2.5-8-1.1v-13Z"/><path d="M12 6.6v13"/>',
    chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
    trophy: '<path d="M8 4h8v4c0 3.2-1.8 5-4 5s-4-1.8-4-5V4Z"/><path d="M8 6H4c0 3 1.4 5 4.4 5M16 6h4c0 3-1.4 5-4.4 5M12 13v4M8 20h8M9 17h6"/>',
    hook: '<path d="M14 3v11a5 5 0 0 1-10 0v-2"/><path d="m1.5 14.5 2.5-3 2.5 3M14 3c3.5 0 5 1.5 5 4"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.book}</svg>`;
}
