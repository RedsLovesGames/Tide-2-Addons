window.TIDEBORNE = {
  groups: [
    { label: "Start", pages: ["home", "installation"] },
    { label: "Core systems", pages: ["tide", "traits", "satchel", "journal", "records", "equipment"] },
    { label: "Integrations", pages: ["myths", "apex", "recipes"] },
    { label: "Reference", pages: ["config", "commands", "datapack", "server-client", "migration", "troubleshooting"] }
  ],

  pages: {
    home: {
      path: "/", nav: "Overview", title: "Tideborne 1.3.28", description: "Tideborne documentation for Minecraft 1.21.1.", body: `
      <section class="hero"><div class="hero-grid"><div><span class="eyebrow">Tideborne 1.3.28</span><h1>Fishing gets deeper.</h1><p class="lead">Tideborne builds on Tide with specimen mutations, an upgradeable Angler's Satchel, shared FTB Teams records, Fish Score rankings, and optional Myths of the Sea and Apex Waters integrations.</p><div class="pill-row"><span class="pill">Minecraft 1.21.1</span><span class="pill">Fabric</span><span class="pill">Java 21+</span><span class="pill">Tide 2.1.1</span></div><div class="button-row"><a class="button primary" href="#/installation">Install & dependencies</a><a class="button" href="#/equipment">Equipment</a><a class="button" href="#/recipes">Recipes</a></div></div><div class="hero-mark"><img src="assets/logo.svg" alt="Tideborne documentation logo"></div></div></section>
      <div class="stat-line"><div><strong>7</strong><span>non-normal mutations</span></div><div><strong>6</strong><span>size bands</span></div><div><strong>8</strong><span>Tideborne recipes</span></div><div><strong>10</strong><span>Top Fish entries</span></div></div>
      <h2 id="systems">What Tideborne changes</h2>
      <div class="feature-band"><div><span class="feature-kicker">Specimens</span></div><div><h3>Every fish can be more than its species</h3><p>Tideborne adds mutations and a species-relative size percentile to Tide fish. Those details feed discovery badges, protection rules, records, and Fish Score.</p><a href="#/traits">Learn mutations and sizes →</a></div></div>
      <div class="feature-band"><div><span class="feature-kicker">Storage</span></div><div><h3>The Angler's Satchel becomes progression</h3><p>Convert a Tide Fish Satchel with XP, then unlock more capacity, automatic storage, sorting, scanning, protection, and team-record tools.</p><a href="#/satchel">Learn the Satchel →</a></div></div>
      <div class="feature-band"><div><span class="feature-kicker">Teams</span></div><div><h3>One team can build one fishing history</h3><p>FTB Teams powers shared discoveries, contributors, first discoveries, largest and smallest records, history, leaderboards, Fish Score, and Top Fish.</p><a href="#/journal">Learn the shared journal →</a></div></div>
      <div class="feature-band"><div><span class="feature-kicker">Equipment</span></div><div><h3>Tide gear gets a complete reference</h3><p>See every Tide 2.1.1 rod, line, hook, bobber, and bait alongside the Tideborne additions and their verified default stats.</p><a href="#/equipment">Open equipment reference →</a></div></div>
      <h2 id="integrations">Optional integrations</h2><p>Myths of the Sea adds boss-material fishing gear and Hippocampus feeding support. Apex Waters adds Great White interactions, scent, chum, shark-tooth equipment, and configurable catch-loss pressure. Both are optional and independent.</p>`
    },

    installation: {
      path: "/installation", nav: "Install & dependencies", title: "Install & dependencies", description: "Install Tideborne 1.3.28 and all verified required or optional dependencies.", body: `
      <span class="eyebrow">Getting started</span><h1>Install & dependencies</h1>
      <p class="lead">Tideborne 1.3.28 is one unified JAR. Do not run the old Tide Traits, Tide Team Journal, or Tidebound Compatibility JARs beside it.</p>
      <h2 id="steps">Install in five steps</h2>
      <ol class="steps"><li><strong>Use Minecraft 1.21.1.</strong><span>Tideborne declares this version exactly.</span></li><li><strong>Install Fabric Loader and Java 21.</strong><span>Fabric Loader must be at least 0.18.4.</span></li><li><strong>Install every required mod below.</strong><span>Tide 2.1.1, Fabric API, Architectury, FTB Library, FTB Teams, and Cloth Config are hard dependencies.</span></li><li><strong>Add Tideborne 1.3.28.</strong><span>Place the unified JAR in the instance's <code>mods</code> folder.</span></li><li><strong>Add optional integrations only if wanted.</strong><span>Myths of the Sea and Apex Waters unlock their matching Tideborne systems. Mod Menu is optional client convenience.</span></li></ol>
      <div class="notice"><div><strong>Server setup in one sentence</strong><p>For normal multiplayer, run Tideborne and its hard dependencies on the server and clients; the server owns gameplay state while the client provides Tideborne screens, previews, mutation rendering, HUD, and tooltips.</p></div></div>
      <h2 id="requirements">Required and optional mods</h2><div id="dependency-list"></div>
      <h2 id="map">How the stack fits together</h2><div id="compat-map"></div>
      <div class="notice warn"><div><strong>Do not mix old module JARs with Tideborne</strong><p>Legacy namespaces and command aliases remain for world compatibility. They are not instructions to keep the older standalone mods installed.</p></div></div>`
    },

    tide: {
      path: "/tide", nav: "Tide integration", title: "How Tideborne uses Tide", description: "A simple explanation of Tideborne's native integration with Tide 2.1.1.", body: `
      <span class="eyebrow">Core integration</span><h1>Tide is the fishing foundation</h1>
      <p class="lead">Tideborne does not replace Tide's fishing system. It reads and extends Tide's fish, size data, rarity, journal, minigame, rods, bait, lines, hooks, bobbers, crates, satchels, and display data.</p>
      <h2 id="catch-flow">What happens when you catch a fish</h2>
      <div class="explain-list"><div><strong>1. Tide chooses the catch.</strong><p>Habitat, conditions, rarity, equipment, bait, and the Tide fishing rules determine what can be caught.</p></div><div><strong>2. Tideborne adds specimen data.</strong><p>The server can assign a mutation and species-relative size percentile when the fish is eligible.</p></div><div><strong>3. Records and discoveries update.</strong><p>Personal discoveries, team discoveries, size records, Fish Score, and Satchel protection can all use that specimen data.</p></div><div><strong>4. The client presents it.</strong><p>Mutation visuals, badges, tooltips, screens, and previews are rendered from server-synchronized state.</p></div></div>
      <h2 id="native">Systems Tideborne directly touches</h2>
      <ul class="dense-list"><li>Tide fish items and fish data</li><li><code>SizeData</code> and species size ranges</li><li>Tide rarity and journal profiles</li><li>Fishing rods, lines, hooks, bait, and bobbers</li><li>Tide crates and catch selection</li><li>The Tide fishing minigame</li><li>Fish Satchel conversion into the Angler's Satchel</li><li>Fish Displays and fish rendering</li></ul>
      <div class="notice"><div><strong>Version boundary</strong><p>Tideborne 1.3.28 declares Tide <strong>2.1.1 exactly</strong>. The Tide equipment reference on this site is based on that 2.1.1 source.</p></div></div>`
    },

    traits: {
      path: "/traits", nav: "Mutations & sizes", title: "Mutations & size bands", description: "Mutation odds, size modifiers, percentiles, and the six Tideborne size bands.", body: `
      <span class="eyebrow">Specimens</span><h1>Mutations & sizes</h1>
      <p class="lead">Tideborne describes an individual fish with two ideas: a mutation, and a percentile that says how large that fish is compared with the normal size range for its species.</p>
      <h2 id="mutations">Mutation defaults</h2>
      <div class="table-wrap"><table><thead><tr><th>Mutation</th><th>Default chance</th><th>Size behavior</th><th>Plain-English meaning</th></tr></thead><tbody>
      <tr><td>Scarred</td><td>about 1 in 35</td><td>Normal size range</td><td>A visibly scarred specimen.</td></tr>
      <tr><td>Parasite-Ridden</td><td>1 in 60</td><td>0.90x to 0.97x</td><td>A slightly undersized specimen with parasite visuals.</td></tr>
      <tr><td>Dwarf</td><td>1 in 80</td><td>0.65x to 0.82x</td><td>A deliberately much smaller specimen.</td></tr>
      <tr><td>Giant</td><td>about 1 in 120</td><td>1.20x to 1.45x</td><td>A deliberately much larger specimen.</td></tr>
      <tr><td>Albino</td><td>1 in 250</td><td>Normal size range</td><td>An albino visual mutation.</td></tr>
      <tr><td>Perfect Specimen</td><td>1 in 400</td><td>75th to 95th normal percentile</td><td>A rare high-quality normal-sized specimen.</td></tr>
      <tr><td>Iridescent</td><td>about 1 in 750</td><td>Normal size range</td><td>The rarest default visual mutation.</td></tr>
      </tbody></table></div>
      <p>Normal is the eighth mutation state and has no special mutation bonus or special appearance. By default, ineligible mutation odds are <strong>not</strong> redistributed into other mutations.</p>
      <h2 id="percentile">What percentile means</h2><p>A percentile is species-relative. A 95th-percentile guppy and a 95th-percentile tuna are both unusually large for their own species, even though their raw lengths are completely different. This lets records and labels compare a fish against the range that makes sense for that species.</p>
      <h2 id="bands">Size bands</h2>
      <div class="table-wrap"><table><thead><tr><th>Band</th><th>Percentile</th><th>How to read it</th></tr></thead><tbody>
      <tr><td>Runty</td><td>below 10</td><td>Bottom 10% of the species range.</td></tr>
      <tr><td>Small</td><td>10 to below 30</td><td>Smaller than a typical specimen.</td></tr>
      <tr><td>Average</td><td>30 to below 60</td><td>Middle of the species range.</td></tr>
      <tr><td>Hefty</td><td>60 to below 85</td><td>Clearly larger than average.</td></tr>
      <tr><td>Trophy</td><td>85 to below 95</td><td>A high-end specimen worth protecting.</td></tr>
      <tr><td>Legendary</td><td>95 or higher</td><td>Top 5% of the species range.</td></tr>
      </tbody></table></div>
      <h2 id="discoveries">Discovery and rendering</h2><p>Discovery can track mutation and size-band discoveries per species. The server owns the specimen data. The client uses Tideborne's masks, badges, and rendering facade to show the result.</p>`
    },

    satchel: {
      path: "/satchel", nav: "Angler's Satchel", title: "Angler's Satchel", description: "A detailed guide to Satchel conversion, capacity, upgrades, Auto-Stow, sorting, scanning, protection, and team records.", body: `
      <span class="eyebrow">Storage progression</span><h1>Angler's Satchel</h1>
      <p class="lead">The Angler's Satchel turns Tide's Fish Satchel into a fishing inventory that grows with XP and can understand Tideborne specimen data.</p>
      <div class="item-hero"><img src="assets/items/anglers_satchel.png" alt="Angler's Satchel"><div><strong>Registry ID</strong><code>tide_traits:anglers_satchel</code><p>The legacy namespace is intentional for saved-world compatibility.</p></div></div>
      <h2 id="get-one">How to get one</h2>
      <div class="explain-list"><div><strong>1. Obtain Tide's Fish Satchel.</strong><p>The Angler's Satchel has no crafting-table recipe of its own.</p></div><div><strong>2. Hold the Tide Fish Satchel and sneak-use it.</strong><p>Tideborne offers the conversion action.</p></div><div><strong>3. Spend 100 XP points.</strong><p>The converted item becomes the Angler's Satchel and starts at base capacity.</p></div></div>
      <h2 id="tabs">What is inside the screen</h2><div class="table-wrap"><table><thead><tr><th>Tab</th><th>What it is for</th></tr></thead><tbody><tr><td>Contents</td><td>Browse the fish currently stored in the Satchel.</td></tr><tr><td>Sorting</td><td>Build and reorder the rules that control how stored fish are displayed.</td></tr><tr><td>Upgrades</td><td>Spend XP on capacity levels and feature unlocks.</td></tr><tr><td>Records</td><td>Inspect personal or shared record information when the matching upgrades are unlocked.</td></tr></tbody></table></div>
      <h2 id="capacity">Capacity progression</h2>
      <div class="table-wrap"><table><thead><tr><th>Capacity level</th><th>Storage multiplier</th><th>XP cost</th><th>What changes</th></tr></thead><tbody><tr><td>Base</td><td>1.0x</td><td>0</td><td>The converted Satchel's starting capacity.</td></tr><tr><td>I</td><td>1.5x</td><td>150</td><td>50% more capacity than base.</td></tr><tr><td>II</td><td>2.0x</td><td>450</td><td>Double base capacity.</td></tr><tr><td>III</td><td>3.0x</td><td>1000</td><td>Triple base capacity.</td></tr></tbody></table></div>
      <h2 id="upgrades">Feature upgrades</h2><div class="table-wrap"><table><thead><tr><th>Upgrade</th><th>XP</th><th>What it unlocks</th><th>Needs a team?</th></tr></thead><tbody>
      <tr><td>Tackle Organizer</td><td>100</td><td>Multi-rule sorting and chained ascending/descending rules.</td><td>No</td></tr>
      <tr><td>Auto-Stow</td><td>200</td><td>Automatically moves eligible catches into the Satchel.</td><td>No</td></tr>
      <tr><td>Record Keeper</td><td>250</td><td>Personal largest and smallest Tide record information.</td><td>No</td></tr>
      <tr><td>Trait Scanner</td><td>300</td><td>Shows specimen length, percentile, mutation, rarity, and region.</td><td>No</td></tr>
      <tr><td>Trophy Lock</td><td>350</td><td>Protects important fish from normal removal/handling rules.</td><td>No</td></tr>
      <tr><td>Shared Ledger</td><td>400</td><td>Adds shared/team record context to the Satchel.</td><td>Yes, for team data</td></tr>
      </tbody></table></div>
      <h2 id="auto-stow">Auto-Stow and protection</h2><p>Auto-Stow is meant to reduce inventory cleanup after fishing. Trophy Lock and the default protection rules keep important catches from being treated like ordinary storage items.</p><p>Default protected categories are: <strong>mutated fish</strong>, <strong>Trophy size</strong>, <strong>Legendary size</strong>, <strong>your personal largest</strong>, <strong>your personal smallest</strong>, and fish with Tide's <strong>Legendary rarity</strong>.</p>
      <h2 id="sorting">Sorting, simply explained</h2><p>A sorting rule chooses one field and one direction. You can chain rules, so the next rule breaks ties from the previous one.</p><div class="table-wrap"><table><thead><tr><th>Sort field</th><th>What it compares</th></tr></thead><tbody><tr><td>Alphabetical</td><td>Fish name.</td></tr><tr><td>Mutation rarity</td><td>How rare the Tideborne mutation is.</td></tr><tr><td>Percentile</td><td>Species-relative specimen size.</td></tr><tr><td>Rarity</td><td>Tide's fish rarity.</td></tr><tr><td>Region</td><td>Tide fishing region/category data.</td></tr><tr><td>Actual size</td><td>Raw measured specimen length.</td></tr></tbody></table></div><div class="notice"><div><strong>Example</strong><p>Sort by Tide rarity descending, then percentile descending. Legendary-rarity fish appear first, and the biggest specimens within each rarity are placed first.</p></div></div>
      <h2 id="multiplayer-behavior">Who controls the Satchel</h2><p>The server validates upgrades, XP spending, contents, Auto-Stow, sorting state, and record data. The client renders the synchronized screen. A multiplayer player therefore needs the Tideborne client to use the full Satchel interface correctly.</p>`
    },

    journal: {
      path: "/journal", nav: "Shared journal", title: "Shared fishing journal", description: "How personal Tide journal progress becomes shared FTB Teams progress in Tideborne.", body: `
      <span class="eyebrow">FTB Teams</span><h1>Shared fishing journal</h1>
      <p class="lead">The shared journal lets a team build one fishing collection together without deleting each player's personal progress.</p>
      <h2 id="what-shares">What gets shared</h2><p>When shared discovery is enabled, the team can combine Tide journal progress and Tideborne record context. The shared systems track species discoveries, first discoveries, catches, contributors, size records, and the team information used by leaderboards and Top Fish.</p>
      <h2 id="how-it-works">How it works</h2>
      <div class="explain-list"><div><strong>You still have personal fishing data.</strong><p>Tideborne does not need to erase the player's own journal just because a team exists.</p></div><div><strong>Your active FTB Teams party provides the shared identity.</strong><p>Team members contribute to the same shared discovery and record backend when the shared systems are enabled.</p></div><div><strong>Missing personal progress can merge once.</strong><p>The merge path imports missing personal journal progress into the shared team state instead of repeatedly duplicating it.</p></div><div><strong>The server is authoritative.</strong><p>Clients display the journal and team UI, but the shared state is decided and stored by the server.</p></div></div>
      <h2 id="joining">Joining, leaving, and former members</h2><p>When a player joins a team, their eligible progress can be merged into that team's shared state. When they leave, the team keeps the records already earned. Former contributors can remain visible in team history and statistics so old catches do not lose their attribution.</p>
      <h2 id="ui">What the player sees</h2><ul><li>A Team Records entry point in the Tide journal flow.</li><li>Shared discovery and record context.</li><li>Contributor/member statistics.</li><li>Record badges and record tooltips when enabled.</li><li>Announcements/toasts for tracked record events.</li><li>Former-member visibility, controlled by client settings.</li></ul>
      <h2 id="defaults">Useful defaults</h2><div class="table-wrap"><table><thead><tr><th>Setting</th><th>Default</th><th>Meaning</th></tr></thead><tbody><tr><td>Shared discovery</td><td>On</td><td>Team discovery progress is available.</td></tr><tr><td>Contribution tracking</td><td>On</td><td>Catches and record activity can be attributed to members.</td></tr><tr><td>Announcements</td><td>On</td><td>Tracked team events can be announced.</td></tr><tr><td>Record badges/tooltips</td><td>On</td><td>Record status can appear directly on fish UI.</td></tr><tr><td>Former members shown</td><td>On client by default</td><td>Historical contributors remain visible unless hidden locally.</td></tr></tbody></table></div>
      <div class="notice"><div><strong>Existing team missing progress?</strong><p>The canonical command surface includes team/journal merge operations. Legacy <code>/ttj</code> aliases also remain for compatibility.</p></div></div>`
    },

    records: {
      path: "/records", nav: "Records & rankings", title: "Records, history, Fish Score & Top Fish", description: "A simple but detailed guide to team records, leaderboard metrics, Fish Score, Top Fish, and ownership repair.", body: `
      <span class="eyebrow">Team competition</span><h1>Records & rankings</h1>
      <p class="lead">Records answer four different questions: who discovered a fish first, who caught the largest one, who caught the smallest one, and which individual catches score highest overall.</p>
      <h2 id="record-types">Record types</h2><div class="table-wrap"><table><thead><tr><th>Record/event</th><th>What it means</th><th>Tracked by default?</th></tr></thead><tbody><tr><td>First discovery</td><td>The first tracked team discovery of a species.</td><td>Yes</td></tr><tr><td>Largest</td><td>The biggest tracked specimen for that species.</td><td>Yes</td></tr><tr><td>Smallest</td><td>The smallest tracked specimen for that species.</td><td>Yes</td></tr><tr><td>Repair</td><td>An ownership/history correction performed through the record tools.</td><td>Yes</td></tr></tbody></table></div>
      <h2 id="history">History and ownership</h2><p>Record history is enabled by default and keeps the newest <strong>200</strong> events by default. Entries can retain the fish, event type, owner/contributor, and time context needed to explain how the current record changed.</p><p>Ownership matters because old migrated records may have a size but no reliable player attribution. Members may claim a record while holding the exact matching fish by default. Repair operations require at least officer rank, while claim-all defaults to owner rank. Operator bypass is enabled by default.</p>
      <h2 id="leaderboards">Leaderboard metrics</h2><div class="table-wrap"><table><thead><tr><th>Metric</th><th>What it ranks</th></tr></thead><tbody><tr><td>Catches</td><td>Total tracked catches contributed by each member.</td></tr><tr><td>Species</td><td>Different species contributed/discovered.</td></tr><tr><td>Record events</td><td>How many tracked record-setting events a member generated.</td></tr><tr><td>Active records</td><td>How many current records the member still owns.</td></tr><tr><td>Fish Score</td><td>Score contribution from high-value individual fish.</td></tr></tbody></table></div>
      <h2 id="fish-score">Fish Score</h2><p>Fish Score is a single number designed to value the whole specimen, not only raw length. Percentile, Tide rarity, mutation rarity, the species record scale, and the actual length all contribute.</p><div class="formula">Score = 5 × percentile + 62.5 × (stars - 1) + mutation bonus + min(300, 75 × sqrt(speciesRecordHighCm / 100)) + min(150, 15 × actualLengthCm / 100)</div>
      <h3 id="rarity-stars">Tide rarity stars</h3><div class="table-wrap"><table><thead><tr><th>Rarity</th><th>Stars used by score</th></tr></thead><tbody><tr><td>Common</td><td>1</td></tr><tr><td>Uncommon</td><td>2</td></tr><tr><td>Rare</td><td>3</td></tr><tr><td>Very Rare</td><td>4</td></tr><tr><td>Epic</td><td>4</td></tr><tr><td>Legendary</td><td>5</td></tr></tbody></table></div>
      <h3 id="mutation-bonus">Mutation bonuses</h3><div class="table-wrap"><table><thead><tr><th>Mutation</th><th>Score bonus</th></tr></thead><tbody><tr><td>Normal</td><td>0</td></tr><tr><td>Parasite-Ridden</td><td>25</td></tr><tr><td>Scarred</td><td>40</td></tr><tr><td>Dwarf</td><td>100</td></tr><tr><td>Giant</td><td>125</td></tr><tr><td>Albino</td><td>200</td></tr><tr><td>Iridescent</td><td>350</td></tr><tr><td>Perfect Specimen</td><td>500</td></tr></tbody></table></div>
      <h2 id="top-fish">Top Fish</h2><p>Top Fish stores the team's ten highest Fish Score entries. Each stored entry can include fish identity, Fish Score, rarity stars, mutation, catcher name/UUID, length, timestamp, and a nonce used by the record flow.</p><div class="notice warn"><div><strong>1.3.28 preview limitation</strong><p>The current Top Fish preview rotates an <code>ItemStack</code> through Minecraft's <code>ItemRenderer</code>. It is not the live Tide fish-entity/display renderer yet.</p></div></div>`
    },

    equipment: {
      path: "/equipment", nav: "Fishing equipment", title: "Tide & Tideborne fishing equipment", description: "Complete Tide 2.1.1 and Tideborne rod, line, hook, bobber, bait, and related fishing-tool reference.", body: `
      <span class="eyebrow">Tide 2.1.1 + Tideborne</span><h1>Fishing equipment</h1>
      <p class="lead">A Tide fishing setup can combine a rod with a line, hook, bobber, and bait. Tideborne adds its own specialized parts and also gives every Tide bobber a Luck/Lure profile.</p>
      <div class="notice"><div><strong>How to read the stats</strong><p><strong>Luck</strong> improves fishing selection. <strong>Lure / fishing speed</strong> affects how quickly bites progress. <strong>Catch difficulty</strong>, catch-zone multipliers, and fish-speed multipliers affect the minigame: a larger catch zone is easier, while a faster fish is harder to track.</p></div></div>
      <h2 id="rods">Rods</h2><p>Tide rods mainly differ by bait-slot count, durability, and special perks. Base durability is before Tide's configurable <code>rodDurabilityMultiplier</code>.</p><div id="rods-table"></div>
      <h2 id="lines">Lines</h2><p>Lines are persistent rod accessories. Tide lines adjust fish speed, catch difficulty, or luck. Tideborne lines modify the catch minigame and can add integration-specific protection.</p><div id="lines-table"></div>
      <h2 id="hooks">Hooks</h2><p>Hooks change what conditions or fish categories a setup favors. Tideborne's Seafarer's Hook and Shark Tooth Hook are weighting tools, not condition-bypass cheats.</p><div id="hooks-table"></div>
      <h2 id="bobbers">Bobbers</h2><p>Tide 2.1.1 provides 33 bobbers. Tideborne does not add a new bobber item in 1.3.28; instead it gives Tide bobbers the default Luck and Lure values below. Every unlisted/fallback Tide bobber uses 0 Luck and +1 Lure.</p><div id="bobbers-table"></div>
      <h2 id="baits">Baits</h2><p>Tide bait lives in the rod's bait slots. Tide's numeric bait data uses fishing-speed and luck bonuses, while some bait has extra selection behavior. Tideborne's Leviathan Bait adds a second, separate fish-selection modifier on top of its Tide bait-data value.</p><div id="baits-table"></div>
      <h2 id="related">Related Tide fishing tools</h2><div id="related-table"></div>
      <div class="notice warn"><div><strong>Hybrid Aquatic note</strong><p>Tide's own hook tag can accept several Hybrid Aquatic hooks when that mod is present. Tideborne 1.3.28 itself does not declare a first-class Hybrid Aquatic integration, so those external hook stats are not presented as Tideborne features here.</p></div></div>`
    },

    myths: {
      path: "/myths", nav: "Myths of the Sea", title: "Myths of the Sea integration", description: "Verified Tideborne behavior when Myths of the Sea 1.3.0 is installed.", body: `
      <span class="eyebrow">Optional · Myths of the Sea 1.3.0</span><h1>Myths of the Sea</h1>
      <p class="lead">Myths materials become specialized Tide fishing parts, and Tide fish are bridged into Hippocampus food. Myths is optional: if it is absent, these recipes and mechanics simply do not load.</p>
      <h2 id="hippocampus">Hippocampus feeding</h2><p>Tideborne bridges <code>#tide:fish</code> into its Hippocampus food integration. That means Tide fish can participate in the Myths feeding/taming food path without Tideborne inventing duplicate fish items.</p>
      <h2 id="gear">Myths-powered gear</h2><div class="table-wrap"><table><thead><tr><th>Item</th><th>Myths material</th><th>Verified Tideborne effect</th></tr></thead><tbody><tr><td>Tentacle Line</td><td>Kraken Tentacle</td><td>1.45x catch zone and 1.18x fish speed.</td></tr><tr><td>Abaia Line</td><td>Abaia Fin</td><td>1.20x catch zone and 1.05x fish speed. Internal registry ID remains <code>swift_line</code>.</td></tr><tr><td>Seafarer's Hook</td><td>Hippocampus Eye</td><td>1.35x rare-fish weighting.</td></tr><tr><td>Kujira Bone Fishing Rod</td><td>Bake Kujira Bone</td><td>3 bait slots, base durability 512, and 1.20x ocean-crate weight.</td></tr><tr><td>Leviathan Bait</td><td>Leviathan Heart</td><td>Fish-only selection, +15 Tideborne fish-selection luck, 1.20x minigame fish speed, and 0.80x catch zone. Its separate Tide bait-data luck value is +4.</td></tr></tbody></table></div>
      <h2 id="leviathan">Leviathan Bait in plain English</h2><p>Leviathan Bait is trophy bait. While it is active, Tideborne removes non-fish outcomes from its custom selection path and heavily favors better fish selection. Habitat and other fish conditions still matter. The tradeoff is a harder minigame: the fish moves 20% faster and the catch zone is reduced to 80% of normal.</p><div class="notice warn"><div><strong>Obsolete behavior removed</strong><p>1.3.28 does not contain the old mythical encounter manager, boss-spawn cooldown, or Seafarer's Hook time/depth bypass. The documentation intentionally does not describe those retired systems.</p></div></div>`
    },

    apex: {
      path: "/apex", nav: "Apex Waters", title: "Apex Waters integration", description: "Great White predation, scent, chum, catch loss, Steel Leader, and Shark Tooth gear defaults.", body: `
      <span class="eyebrow">Optional · Apex Waters 1.1.1</span><h1>Apex Waters</h1>
      <p class="lead">With Apex Waters installed, Tideborne gives Great White sharks reasons to care about Tide fish: they can detect prey, hunt fish, react to scent and chum, and add a small risk of losing a hooked catch.</p>
      <h2 id="predation">Sharks hunting fish</h2><div class="table-wrap"><table><thead><tr><th>Default</th><th>Value</th><th>Meaning</th></tr></thead><tbody><tr><td>Detection radius</td><td>48 blocks</td><td>How far the shark search can reach.</td></tr><tr><td>Prey acquisition</td><td>35%</td><td>Default chance used when choosing prey.</td></tr><tr><td>Fullness target</td><td>40</td><td>Sharks stop aggressively seeking food once sufficiently full.</td></tr><tr><td>Prey cooldown</td><td>200 ticks</td><td>Delay between prey actions.</td></tr><tr><td>Scan interval</td><td>20 ticks</td><td>How often prey scans run.</td></tr><tr><td>Food satiation</td><td>30</td><td>Fullness gained from a successful fish meal.</td></tr></tbody></table></div>
      <h2 id="catch-loss">Hooked-catch loss</h2><p>Catch loss is abstract in 1.3.28. The shark does not physically steal the rendered hooked-fish entity. Tideborne calculates a bounded loss chance from a base risk plus scent/food modifiers.</p><div class="table-wrap"><table><thead><tr><th>Component</th><th>Default</th></tr></thead><tbody><tr><td>Base chance</td><td>0.5%</td></tr><tr><td>Per scent strength</td><td>+1.2%</td></tr><tr><td>Scent contribution cap</td><td>12%</td></tr><tr><td>Large-fish bonus</td><td>+5%</td></tr><tr><td>Tuna bonus</td><td>+10%</td></tr><tr><td>Final maximum</td><td>25%</td></tr><tr><td>Steel Leader prevention</td><td>90%</td></tr></tbody></table></div>
      <h2 id="chum">Chum Bucket and scent</h2><p>A Chum Bucket creates a bounded scent zone instead of permanently spawning an uncontrolled cloud. Defaults are 90 seconds, 48-block radius, scent strength 8, 500 particles, 10-tick particle pulse, 200-tick spawn checks, 1-in-20 spawn chance, nearby shark cap 2, and 16 spawn attempts. Triggered shark spawning is disabled by default, and spawning is restricted to ocean water.</p>
      <h2 id="gear">Apex gear</h2><ul><li><strong>Steel Leader:</strong> 0.90x catch zone, 1.05x fish speed, 90% default protection against Tideborne catch loss.</li><li><strong>Shark Tooth Hook:</strong> 2.5x predatory-fish weight and 0.35x small-fish weight.</li><li><strong>Shark Tooth:</strong> Great White sharks have a 35% Tideborne tooth-drop chance.</li></ul>`
    },

    recipes: {
      path: "/recipes", nav: "Recipes", title: "Tideborne crafting recipes", description: "All eight Tideborne 1.3.28 crafting recipes using real source textures for ingredients.", body: `
      <span class="eyebrow">Exact JAR recipe data</span><h1>Crafting recipes</h1>
      <p class="lead">These are the eight crafting recipes packaged by Tideborne 1.3.28. The grid uses the actual Tideborne output textures plus real Tide, Myths, and Minecraft ingredient textures where the recipe references those mods.</p>
      <div class="notice"><div><strong>Tag ingredient</strong><p>The Chum Bucket's fish slots are <code>#tidebound_compatibility:shark_food</code>, not one exact fish. A Tide tuna texture is shown as the representative icon, with a # badge, because any valid item in that tag can fill the slot.</p></div></div>
      <div id="recipe-grid" class="recipe-grid"></div>
      <h2 id="acquisition">Non-crafting acquisition</h2><div class="table-wrap"><table><thead><tr><th>Item</th><th>How it is obtained</th></tr></thead><tbody><tr><td>Angler's Satchel</td><td>Sneak-use a Tide Fish Satchel and spend 100 XP points.</td></tr><tr><td>Shark Tooth</td><td>35% Tideborne drop chance from the Apex Great White integration.</td></tr></tbody></table></div>`
    },

    config: {
      path: "/reference/config", nav: "Configuration", title: "Configuration", description: "Canonical Tideborne configuration sections and useful verified defaults.", body: `
      <span class="eyebrow">Reference</span><h1>Configuration</h1><p class="lead">The canonical file is <code>config/tideborne.json</code>. Gameplay settings are server-authoritative; client sections control presentation.</p>
      <h2 id="sections">Config sections</h2><div class="table-wrap"><table><thead><tr><th>Section</th><th>Controls</th></tr></thead><tbody><tr><td><code>traits</code></td><td>Mutation odds, specimen eligibility, discovery, rendering/cache behavior, and Satchel defaults.</td></tr><tr><td><code>team_server</code></td><td>Shared journal, leaderboards, history, repair permissions, announcements, record tracking, and bobber gameplay.</td></tr><tr><td><code>team_client</code></td><td>Team UI, badges, tooltips, default tab/metric, former-member visibility, and toast presentation.</td></tr><tr><td><code>fishing_server</code></td><td>Myths/Apex equipment, Leviathan Bait, shark loss, chum, scent, and integration gameplay.</td></tr><tr><td><code>fishing_client</code></td><td>Fishing HUD and equipment tooltip display.</td></tr><tr><td><code>migration</code></td><td>Legacy config/data migration bookkeeping.</td></tr></tbody></table></div>
      <h2 id="team-defaults">Team defaults</h2><p>Leaderboards, history, contribution tracking, announcements, record badges, record tooltips, and bobber bonuses are enabled by default. History keeps 200 events by default. Repair requires officer rank, claim-all requires owner rank, and operator bypass is enabled.</p>
      <h2 id="client-defaults">Client defaults</h2><p>Record badges, record tooltips, Team Records button, and former-member visibility are on. The default Team Records tab is Summary, default leaderboard metric is Catches, and the full toast lasts 5 seconds with sound enabled.</p>
      <h2 id="fishing-defaults">Fishing defaults</h2><p>Fishing HUD/tooltips are enabled. Apex Great White attraction/predation and catch-loss logic are enabled when Apex is available; triggered chum shark spawning is off by default.</p>`
    },

    commands: {
      path: "/reference/commands", nav: "Commands", title: "Commands", description: "Canonical Tideborne command surface and legacy aliases.", body: `
      <span class="eyebrow">Reference</span><h1>Commands</h1><p>The canonical root is <code>/tideborne</code>.</p>
      <div class="command"><code>/tideborne help</code><span>Show the current Tideborne command help.</span></div><div class="command"><code>/tideborne status</code><span>Show status/integration information.</span></div><div class="command"><code>/tideborne reload</code><span>Reload current configuration. Permission level 2.</span></div><div class="command"><code>/tideborne migrate status</code><span>Show migration state.</span></div><div class="command"><code>/tideborne debug backend</code><span>Backend diagnostic information.</span></div>
      <h2 id="traits">Traits admin</h2><p>Under <code>/tideborne traits</code>: <code>inspect</code>, <code>setmutation &lt;id&gt;</code>, <code>clearmutation</code>, <code>percentile &lt;0.0-1.0&gt;</code>, and <code>dumpfish</code>. These are operator/admin tools and require permission level 2.</p>
      <h2 id="journal-team">Journal and team</h2><p>The journal/team command surface includes open/help, merge, claim largest/smallest, assign largest/smallest to a member, claimall, status, leaderboard metric/page selection, history paging, per-fish history, member lookup, and team config reload.</p>
      <h2 id="fishing">Fishing</h2><p><code>/tideborne fishing status</code> reports fishing integration state. Fishing reload is an operator action.</p>
      <h2 id="legacy">Legacy aliases</h2><p><code>/tidetraits</code>, <code>/tideteamjournal</code>, <code>/ttj</code>, and <code>/tideboundcompat</code> remain for compatibility with older workflows.</p>`
    },

    datapack: {
      path: "/reference/datapack", nav: "Datapack tags", title: "Datapack tags", description: "Tideborne fish-category and integration tags intended for datapack extension.", body: `
      <span class="eyebrow">Reference</span><h1>Datapack tags</h1><p class="lead">Tideborne uses tags so pack authors can extend categories without patching Java code.</p>
      <div class="table-wrap"><table><thead><tr><th>Tag/category</th><th>Default role</th></tr></thead><tbody><tr><td><code>#tidebound_compatibility:shark_food</code></td><td>Feeds the shark/chum food category and starts from Tide fish.</td></tr><tr><td><code>strong_shark_food</code></td><td>Combines large fish with Tide legendary fish for stronger scent behavior.</td></tr><tr><td><code>large_fish</code></td><td>Explicit large-fish category used by Apex scent/loss logic.</td></tr><tr><td><code>very_small_fish</code></td><td>Explicit small-fish category used by weighting logic.</td></tr><tr><td><code>predatory_fish</code></td><td>Fish category favored by Shark Tooth Hook.</td></tr><tr><td><code>tuna</code></td><td>Includes <code>tide:tuna</code> and <code>tide:volcano_tuna</code>.</td></tr><tr><td><code>hippocampus_food</code></td><td>Bridges Tide fish into the Myths Hippocampus food path.</td></tr></tbody></table></div><p>The JAR also includes mutation-exclusion tags, including per-mutation exclusions and a general mutation-excluded category.</p>`
    },

    "server-client": {
      path: "/reference/server-client", nav: "Server vs client", title: "Server vs client", description: "What the server owns and what the client renders in Tideborne multiplayer.", body: `
      <span class="eyebrow">Architecture</span><h1>Server vs client</h1><p class="lead">The short version: if a setting can change gameplay, records, or persistent item state, the server decides it. The client draws the UI and effects from synchronized data.</p>
      <div class="table-wrap"><table><thead><tr><th>System</th><th>Authority</th><th>Client role</th></tr></thead><tbody><tr><td>Mutation, size, percentile</td><td>Server</td><td>Render mutation and specimen presentation.</td></tr><tr><td>Discovery state</td><td>Server</td><td>Show badges and journal state.</td></tr><tr><td>Angler's Satchel</td><td>Server</td><td>Render the synchronized Satchel screen.</td></tr><tr><td>Team records/history/leaderboards</td><td>Server</td><td>Render Team Records and notifications.</td></tr><tr><td>Fish Score / Top Fish</td><td>Server</td><td>Render rankings and item-stack preview.</td></tr><tr><td>Bobber bonuses and equipment</td><td>Server</td><td>Show tooltips/HUD.</td></tr><tr><td>Leviathan/Apex/chum logic</td><td>Server</td><td>Effects and feedback.</td></tr></tbody></table></div>`
    },

    migration: {
      path: "/reference/migration", nav: "Migration", title: "Migration from older modules", description: "How Tideborne preserves legacy IDs and imports old configuration/data.", body: `
      <span class="eyebrow">Compatibility</span><h1>Migration</h1><p>Tideborne is the canonical runtime mod, but it provides old IDs such as <code>tide_traits</code>, <code>tide_team_journal</code>, and <code>tidebound_compatibility</code> where compatibility matters.</p>
      <h2 id="configs">Old config import</h2><p>Migration knows about historical files such as <code>tide_traits.json</code>, <code>tide_team_journal-server.json</code>, <code>tide_team_journal-client.json</code>, <code>tidebound_compatibility.json</code>, and <code>tidebound_compatibility-client.json</code>. The canonical current file remains <code>config/tideborne.json</code>.</p>
      <h2 id="jars">What to install now</h2><p>Use the unified Tideborne JAR only. Keeping legacy identifiers inside saved data is different from keeping the old standalone JARs installed.</p>
      <h2 id="version">Which version string wins?</h2><p><code>fabric.mod.json</code> reports 1.3.28 and is authoritative. A few internal migration/status strings can still contain older version text.</p>`
    },

    troubleshooting: {
      path: "/reference/troubleshooting", nav: "Troubleshooting", title: "Troubleshooting", description: "Common Tideborne 1.3.28 setup and documentation problems.", body: `
      <span class="eyebrow">Reference</span><h1>Troubleshooting</h1>
      <h2 id="client">The Satchel or team screen does not work on a client</h2><p>Install Tideborne and its hard dependencies on the client too. The server owns state, but these screens are Tideborne client UI.</p>
      <h2 id="recipes">Myths or Apex recipes do not appear</h2><p>Integration recipes are conditional. Myths recipes require Myths of the Sea. Apex recipes require Apex Waters.</p>
      <h2 id="leviathan">Another guide says Leviathan Bait summons a boss</h2><p>That guide is describing an obsolete implementation. In 1.3.28 Leviathan Bait is fish-only trophy bait with selection/minigame modifiers.</p>
      <h2 id="seafarer">Another guide says Seafarer's Hook bypasses time or depth</h2><p>That is also obsolete for 1.3.28. The current verified Tideborne behavior is rare-fish weighting.</p>
      <h2 id="config">I edited an old module config and nothing changed</h2><p>Use <code>config/tideborne.json</code> for the unified mod. Legacy files are migration inputs or compatibility remnants.</p>
      <h2 id="topfish">Top Fish does not look like a live 3D fish</h2><p>That is a current 1.3.28 limitation. The preview rotates an item stack through Minecraft's ItemRenderer.</p>`
    }
  },

  dependencies: [
    {name:"Minecraft",kind:"required",version:"1.21.1 exactly",purpose:"Target game version.",features:"All Tideborne systems",url:"https://www.minecraft.net/"},
    {name:"Fabric Loader",kind:"required",version:">=0.18.4",purpose:"Fabric runtime loader.",features:"All Tideborne systems",url:"https://fabricmc.net/use/installer/"},
    {name:"Fabric API",kind:"required",version:">=0.116.15+1.21.1",purpose:"Fabric platform APIs used by the mod.",features:"All Tideborne systems",url:"https://modrinth.com/mod/fabric-api"},
    {name:"Tide",kind:"required",version:"2.1.1 exactly",purpose:"The fishing system Tideborne extends.",features:"Fish, journal, equipment, minigame, bobbers, crates, satchel",url:"https://modrinth.com/mod/tide"},
    {name:"Architectury",kind:"required",version:">=13.0.8",purpose:"Shared mod infrastructure required at runtime.",features:"Runtime",url:"https://modrinth.com/mod/architectury-api"},
    {name:"FTB Library",kind:"required",version:">=2101.1.30",purpose:"FTB support library used by team systems.",features:"Shared journal and records",url:"https://www.curseforge.com/minecraft/mc-mods/ftb-library-forge"},
    {name:"FTB Teams",kind:"required",version:">=2101.1.10",purpose:"Provides the party/team identity for shared data.",features:"Shared journal, contributors, records, leaderboards",url:"https://www.curseforge.com/minecraft/mc-mods/ftb-teams-fabric"},
    {name:"Cloth Config",kind:"required",version:">=15.0.140",purpose:"Configuration infrastructure.",features:"Config UI and settings",url:"https://modrinth.com/mod/cloth-config"},
    {name:"Myths of the Sea",kind:"optional",version:"1.3.0 exactly",purpose:"Adds the material sources and entities used by Tideborne's Myths bridge.",features:"Hippocampus food, Tentacle/Abaia lines, Seafarer's Hook, Kujira rod, Leviathan Bait",url:"https://modrinth.com/mod/myths-of-the-sea"},
    {name:"Apex Waters",kind:"optional",version:"1.1.1 exactly",purpose:"Adds Great White sharks used by Tideborne's Apex integration.",features:"Predation, scent, chum, catch loss, shark-tooth gear",url:"https://modrinth.com/mod/apex-waters"},
    {name:"Mod Menu",kind:"optional",version:"Any compatible version",purpose:"Convenient client entry point for configuration.",features:"Client configuration access",url:"https://modrinth.com/mod/modmenu"}
  ],

  recipes: [
    {name:"Tentacle Line",type:"shapeless",mod:"Myths",ingredients:["myths_of_the_sea:kraken_tentacle","tide:fishing_line"],output:"tidebound_compatibility:tentacle_line",count:1},
    {name:"Abaia Line",type:"shapeless",mod:"Myths",ingredients:["myths_of_the_sea:abaia_fin","tide:fishing_line"],output:"tidebound_compatibility:swift_line",count:1,note:"Registry ID remains swift_line for compatibility."},
    {name:"Seafarer's Hook",type:"shapeless",mod:"Myths",ingredients:["myths_of_the_sea:hippocampus_eye","tide:fishing_hook"],output:"tidebound_compatibility:seafarers_hook",count:1},
    {name:"Kujira Bone Fishing Rod",type:"shaped",mod:"Myths",pattern:["  B"," BS","B S"],key:{B:"myths_of_the_sea:bake_kujira_bone",S:"minecraft:string"},output:"tidebound_compatibility:kujira_bone_fishing_rod",count:1},
    {name:"Leviathan Bait",type:"shapeless",mod:"Myths",ingredients:["myths_of_the_sea:leviathan_heart"],output:"tidebound_compatibility:leviathan_bait",count:12,note:"One Leviathan Heart crafts 12 bait."},
    {name:"Chum Bucket",type:"shaped",mod:"Apex",pattern:["FFF","FBF"," F "],key:{F:"#tidebound_compatibility:shark_food",B:"minecraft:bucket"},output:"tidebound_compatibility:chum_bucket",count:1,note:"Six shark_food-tag ingredients plus one bucket."},
    {name:"Steel Leader",type:"shaped",mod:"Apex",pattern:[" II","ICI","II "],key:{I:"minecraft:iron_nugget",C:"minecraft:chain"},output:"tidebound_compatibility:steel_leader",count:1},
    {name:"Shark Tooth Hook",type:"shapeless",mod:"Apex",ingredients:["tidebound_compatibility:shark_tooth","tide:fishing_hook"],output:"tidebound_compatibility:shark_tooth_hook",count:1}
  ],

  equipment: {
    rods: [
      ["Stone Fishing Rod","Tide","1","48","No additional rod perk."],
      ["Iron Fishing Rod","Tide","1","64","No additional rod perk."],
      ["Golden Fishing Rod","Tide","2","36","+1 fishing luck."],
      ["Crystal Fishing Rod","Tide","2","80","Plays a sound when a fish bites."],
      ["Diamond Fishing Rod","Tide","2","128","Grants extra XP."],
      ["Netherite Fishing Rod","Tide","2","512","Can fish in lava."],
      ["Echo Fishing Rod","Tide","3","256","Detects which fish is hooked."],
      ["Prismarine Fishing Rod","Tide","3","256","+1 fishing speed and +1 luck while in rain."],
      ["Sunflower Fishing Rod","Tide","6","256","+1 luck while in sunlight."],
      ["Rod of the Hero (village_fishing_rod)","Tide","4","256","Can catch additional loot."],
      ["Blazing Fishing Rod","Tide","4","256","Can fish in lava and catch Nether fish in any lava."],
      ["Honeycomb Fishing Rod","Tide","5","256","Five bait slots; 5% chance to drop when a beehive drops honeycomb. No additional fishing-stat perk."],
      ["Midas Fishing Rod","Tide","3","256","+1 fishing luck and can catch additional gold items."],
      ["Kujira Bone Fishing Rod","Tideborne + Myths","3","512","1.20x ocean-crate weight." ]
    ],
    lines: [
      ["Fishing Line","Tide","Baseline","Standard Tide line."],
      ["Copper Line","Tide","-10% fish speed","Fish moves more slowly in the minigame."],
      ["Iron Line","Tide","-15% catch difficulty","Makes the catch minigame easier."],
      ["Golden Line","Tide","-5% fish speed; +1 luck","Small minigame help plus fishing luck."],
      ["Diamond Line","Tide","-25% catch difficulty","Largest Tide line reduction to catch difficulty."],
      ["Tentacle Line","Tideborne + Myths","1.45x catch zone; 1.18x fish speed","Much larger zone, but the fish also moves faster."],
      ["Abaia Line","Tideborne + Myths","1.20x catch zone; 1.05x fish speed","Moderate zone increase with a small fish-speed tradeoff. Registry ID: swift_line."],
      ["Steel Leader","Tideborne + Apex","0.90x catch zone; 1.05x fish speed","Harder minigame, but prevents 90% of Tideborne Apex catch-loss events by default."]
    ],
    hooks: [
      ["Fishing Hook","Tide","Baseline","Standard Tide hook."],
      ["Fiery Hook","Tide","Raises water temperature","Helps satisfy warmer-water fish conditions."],
      ["Permafrost Hook","Tide","Lowers water temperature","Helps satisfy colder-water fish conditions."],
      ["Twilight Hook","Tide","Inverts fish time preferences","Swaps the normal time preference logic for fish selection."],
      ["Lavaproof Hook","Tide","Allows fishing in lava","Makes a compatible rod setup lava-capable."],
      ["Hook of the Depths (void_hook)","Tide","Allows fishing in the void","Enables Tide's void fishing medium."],
      ["Seafarer's Hook","Tideborne + Myths","1.35x rare-fish weighting","Raises rare-fish selection weight. No 1.3.28 time/depth bypass."],
      ["Shark Tooth Hook","Tideborne + Apex","2.5x predatory; 0.35x small-fish weight","Strongly favors predatory fish and suppresses very small fish."]
    ],
    bobbers: [
      ["Red Bobber","0","+1","Dyed bobber default"],["Orange Bobber","0","+1","Dyed bobber default"],["Yellow Bobber","0","+1","Dyed bobber default"],["Lime Bobber","0","+1","Dyed bobber default"],["Green Bobber","0","+1","Dyed bobber default"],["Cyan Bobber","0","+1","Dyed bobber default"],["Light Blue Bobber","0","+1","Dyed bobber default"],["Blue Bobber","0","+1","Dyed bobber default"],["Purple Bobber","0","+1","Dyed bobber default"],["Magenta Bobber","0","+1","Dyed bobber default"],["Pink Bobber","0","+1","Dyed bobber default"],["White Bobber","0","+1","Dyed bobber default"],["Light Gray Bobber","0","+1","Dyed bobber default"],["Gray Bobber","0","+1","Dyed bobber default"],["Black Bobber","0","+1","Dyed bobber default"],["Brown Bobber","0","+1","Dyed bobber default"],
      ["Apple Bobber","0","+1","Uses Tideborne fallback default"],["Golden Apple Bobber","+1","+1","Balanced luck and lure"],["Enchanted Golden Apple Bobber","+2","+2","High balanced bonus"],["Iron Bobber","0","+2","Lure-focused"],["Golden Bobber","+2","0","Luck-focused"],["Diamond Bobber","+1","+2","Lure-leaning balanced bonus"],["Netherite Bobber","+2","+2","High balanced bonus"],["Amethyst Bobber","+2","0","Luck-focused"],["Echo Bobber","0","+3","Highest lure tier"],["Chorus Bobber","+1","+1","Balanced"],["Feather Bobber","0","+3","Highest lure tier"],["Lichen Bobber","0","+2","Lure-focused"],["Nautilus Bobber","+2","0","Luck-focused"],["Pearl Bobber","+1","+2","Lure-leaning balanced bonus"],["Heart Bobber","+3","0","Highest luck tier"],["Grassy Bobber","+1","+1","Balanced"],["Duck Bobber","0","+2","Lure-focused"]
    ],
    baits: [
      ["Bait","Tide","+2","0","Basic speed bait."],
      ["Lucky Bait","Tide","0","+2","Luck-focused bait."],
      ["Magnetic Bait","Tide","0","0","Multiplies Tide crate-selector weight by 5x while present."],
      ["Incandescent Bait","Tide","+1","0","Small fishing-speed bonus."],
      ["Abyss Bait","Tide","+2","0","Fishing-speed bonus in Tide bait data."],
      ["Leviathan Bait","Tideborne + Myths","0","+4 Tide bait luck","Also fish-only, +15 Tideborne fish-selection luck, 1.20x fish speed, 0.80x catch zone; crafts 12 from one Leviathan Heart."]
    ],
    related: [
      ["Angling Table","Tide","Rod customization/upgrade interface used by Tide equipment."],
      ["Fishing Journal","Tide","Tracks fish discovery and fish information; Tideborne extends it with team context."],
      ["Fish Satchel","Tide","Base fish-storage item and the item converted into an Angler's Satchel."],
      ["Fishy Note","Tide","Journal-related collectible/information item."],
      ["Pocket Watch","Tide","Fishing informational tool."],
      ["Lunar Calendar","Tide","Fishing informational tool."],
      ["Climate Gauge","Tide","Fishing informational tool."],
      ["Depth Meter","Tide","Fishing informational tool."],
      ["Weather Radio","Tide","Fishing informational tool."],
      ["Fish Finder","Tide","Displays fishing information."],
      ["Angler's Satchel","Tideborne","XP-upgradeable Tide Fish Satchel replacement with specimen-aware storage tools."],
      ["Chum Bucket","Tideborne + Apex","Creates the bounded scent/chum zone used by the Apex integration."],
      ["Shark Tooth","Tideborne + Apex","35% default Great White drop used to craft Shark Tooth Hook."]
    ]
  }
};
