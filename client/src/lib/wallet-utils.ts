export function addressHash(address: string): number {
  let h = 5381;
  for (let i = 0; i < address.length; i++) {
    h = ((h << 5) + h + address.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function isEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && !address.startsWith("0x");
}

export type AddressNetwork = "eth" | "solana" | "unknown";

export function detectAddressNetwork(address: string): AddressNetwork {
  if (isEVMAddress(address.trim())) return "eth";
  if (isSolanaAddress(address.trim())) return "solana";
  return "unknown";
}

export function getChainInfo(address: string) {
  if (isEVMAddress(address)) {
    return { chain: "Ethereum", symbol: "ETH", decimals: 4, gasLabel: "Gas Spent", feeLabel: "ETH" };
  }
  if (isSolanaAddress(address)) {
    return { chain: "Solana", symbol: "SOL", decimals: 4, gasLabel: "Tx Fees Spent", feeLabel: "SOL" };
  }
  return { chain: "Ethereum", symbol: "ETH", decimals: 4, gasLabel: "Gas Spent", feeLabel: "ETH" };
}

export function generateWalletStats(address: string) {
  const h = addressHash(address);
  const h2 = addressHash(address + "salt2");
  const h3 = addressHash(address + "salt3");
  const h4 = addressHash(address + "salt4");
  const chainInfo = getChainInfo(address);

  const ETH_PRICE = 3248;
  const SOL_PRICE = 143;
  const price = chainInfo.symbol === "SOL" ? SOL_PRICE : ETH_PRICE;

  const nativeBalanceRaw =
    chainInfo.symbol === "SOL"
      ? (2 + (h % 18000) / 1000)
      : (0.05 + (h % 12000) / 10000);

  const nativeBalance = nativeBalanceRaw.toFixed(chainInfo.decimals);
  const portfolioUSD = Math.round(nativeBalanceRaw * price + (h2 % 8000));

  const gasSpentRaw =
    chainInfo.symbol === "SOL"
      ? (0.01 + (h3 % 800) / 1000)
      : (0.08 + (h3 % 1400) / 1000);

  const gasSpentNative = gasSpentRaw.toFixed(4);
  const gasSpentUSD = Math.round(gasSpentRaw * price);

  const recoverablePct = 0.22 + (h4 % 12) / 100;
  const recoverableNative = (gasSpentRaw * recoverablePct).toFixed(4);
  const recoverableUSD = Math.round(gasSpentRaw * recoverablePct * price);

  const activeDapps = 2 + (h2 % 16);
  const txCount = 80 + (h3 % 920);
  const securityScoreBase = 48 + (h4 % 30);

  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const approvalCount = 4 + (h % 18);

  return {
    ...chainInfo,
    nativeBalance,
    portfolioUSD,
    gasSpentNative,
    gasSpentUSD,
    recoverableNative,
    recoverableUSD,
    activeDapps,
    txCount,
    securityScoreBase,
    shortAddr,
    approvalCount,
    address,
  };
}

export function generateDevices(address: string) {
  const h = addressHash(address);
  const browsers = ["Chrome", "Firefox", "Brave", "Safari", "Edge"];
  const oses = ["Windows 11", "macOS", "Linux", "Ubuntu"];
  const cities: [string, string][] = [
    ["New York, US", "active"],
    ["London, UK", "inactive"],
    ["Moscow, RU", "suspicious"],
    ["Tokyo, JP", "inactive"],
    ["Berlin, DE", "inactive"],
  ];

  const browser1 = browsers[h % browsers.length];
  const os1 = oses[h % oses.length];
  const city2 = cities[(h + 1) % cities.length];
  const city3 = cities[(h + 2) % cities.length];
  const city4 = cities[(h + 3) % cities.length];

  const hoursAgo = 1 + (h % 23);
  const daysAgo = 1 + (h % 6);

  return [
    {
      id: "d1",
      name: `${browser1} — ${os1}`,
      type: "desktop" as const,
      location: "Your Location",
      lastSeen: "Active now",
      isCurrent: true,
      status: "active" as const,
    },
    {
      id: "d2",
      name: `MetaMask Mobile — ${h % 2 === 0 ? "iOS" : "Android"}`,
      type: "mobile" as const,
      location: city2[0],
      lastSeen: `${hoursAgo}h ago`,
      isCurrent: false,
      status: "active" as const,
    },
    {
      id: "d3",
      name: `${browsers[(h + 2) % browsers.length]} — Unknown`,
      type: "browser" as const,
      location: city3[0],
      lastSeen: `${daysAgo} days ago`,
      isCurrent: false,
      status: city3[1] as "active" | "suspicious" | "inactive",
    },
    {
      id: "d4",
      name: `${browsers[(h + 3) % browsers.length]} — ${oses[(h + 1) % oses.length]}`,
      type: "desktop" as const,
      location: city4[0],
      lastSeen: `${daysAgo + 3} days ago`,
      isCurrent: false,
      status: "inactive" as const,
    },
  ];
}

export function generateApprovals(address: string) {
  const h = addressHash(address);
  const tokens = ["USDC", "USDT", "WETH", "DAI", "LINK", "UNI", "AAVE", "WBTC"];
  const dapps = ["Uniswap V3", "Aave V3", "Compound V2", "1inch", "Unknown Contract", "OpenSea", "Blur"];
  const amounts = ["Unlimited", "Unlimited", "500", "1,000", "Unlimited", "250"];

  const count = 3 + (h % 4);
  const result = [];
  for (let i = 0; i < count; i++) {
    const token = tokens[(h + i) % tokens.length];
    const dapp = dapps[(h + i * 2) % dapps.length];
    const amount = amounts[(h + i) % amounts.length];
    const isUnlimited = amount === "Unlimited";
    const isUnknown = dapp === "Unknown Contract";
    result.push({
      token,
      dapp,
      amount: isUnlimited ? "Unlimited" : `${amount} ${token}`,
      risk: (isUnlimited && isUnknown) || (i === 1) ? "high" : "low",
    });
  }
  return result;
}

const BIP39_PATTERN = /^[a-z]{3,8}$/;
const KNOWN_BIP39_SAMPLE = new Set([
  "abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse",
  "access","accident","account","accuse","achieve","acid","acoustic","acquire","across","act",
  "action","actor","actress","actual","adapt","add","addict","address","adjust","admit",
  "adult","advance","advice","aerobic","afford","afraid","again","age","agent","agree",
  "ahead","aim","air","airport","aisle","alarm","album","alcohol","alert","alien",
  "all","alley","allow","almost","alone","alpha","already","also","alter","always",
  "amateur","amazing","among","amount","amused","analyst","anchor","ancient","anger","angle",
  "angry","animal","ankle","announce","annual","another","answer","antenna","antique","anxiety",
  "any","apart","apology","appear","apple","approve","april","arch","arctic","area",
  "arena","argue","arm","armed","armor","army","around","arrange","arrest","arrive",
  "arrow","art","artefact","artist","artwork","ask","aspect","assault","asset","assist",
  "assume","asthma","athlete","atom","attack","attend","attitude","attract","auction","audit",
  "august","aunt","author","auto","autumn","average","avocado","avoid","awake","aware",
  "away","awesome","awful","awkward","axis","baby","balance","bamboo","banana","banner",
  "bar","barely","bargain","barrel","base","basic","basket","battle","beach","bean",
  "beauty","because","become","beef","before","begin","behave","behind","believe","below",
  "belt","bench","benefit","best","betray","better","between","beyond","bicycle","bid",
  "bike","bind","biology","bird","birth","bitter","black","blade","blame","blanket",
  "blast","bleak","bless","blind","blood","blossom","blouse","blue","blur","blush",
  "board","boat","body","boil","bomb","bone","book","boost","border","boring",
  "borrow","boss","bottom","bounce","box","boy","bracket","brain","brand","brave",
  "bread","breeze","brick","bridge","brief","bright","bring","brisk","broccoli","broken",
  "bronze","broom","brother","brown","brush","bubble","buddy","budget","buffalo","build",
  "bulb","bulk","bullet","bundle","bunker","burden","burger","burst","bus","business",
  "busy","butter","buyer","buzz","cabbage","cabin","cable","cactus","cage","cake",
  "call","calm","camera","camp","canal","cancel","candy","cannon","canvas","canyon",
  "capable","capital","captain","car","carbon","card","cargo","carpet","carry","cart",
  "case","cash","casino","castle","casual","cat","catalog","catch","category","cattle",
  "caught","cause","caution","cave","ceiling","celery","cement","census","century","cereal",
  "certain","chair","chalk","champion","change","chaos","chapter","charge","chase","chat",
  "cheap","check","cheese","chef","cherry","chest","chicken","chief","child","chimney",
  "choice","choose","chronic","chuckle","chunk","cigar","cinnamon","circle","citizen","city",
  "civil","claim","clap","clarify","claw","clay","clean","clerk","clever","click",
  "client","cliff","climb","clinic","clip","clock","clog","close","cloth","cloud",
  "clown","club","clump","cluster","clutch","coach","coast","coconut","code","coffee",
  "coil","coin","collect","color","column","combine","come","comfort","comic","common",
  "company","concert","conduct","confirm","congress","connect","consider","control","convince","cook",
  "cool","copper","copy","coral","core","corn","correct","cost","cotton","couch",
  "country","couple","course","cousin","cover","coyote","crack","cradle","craft","cram",
  "crane","crash","crater","crawl","crazy","cream","credit","creek","crew","cricket",
  "crisp","critic","cross","crouch","crowd","crucial","cruel","cruise","crumble","crunch",
  "crush","cry","crystal","cube","culture","cup","cupboard","curious","current","curtain",
  "curve","cushion","custom","cute","cycle","dad","damage","damp","dance","danger",
  "daring","dash","daughter","dawn","day","deal","debate","debris","decade","december",
  "decide","decline","decorate","decrease","deer","defense","define","defy","degree","delay",
  "deliver","demand","demise","denial","dentist","deny","depart","depend","deposit","depth",
  "deputy","derive","describe","desert","design","desk","despair","destroy","detail","detect",
  "develop","device","devote","diagram","dial","diamond","diary","dice","diesel","diet",
  "differ","digital","dignity","dilemma","dinner","dinosaur","direct","dirt","disagree","discover",
  "disease","dish","dismiss","disorder","display","distance","divert","divide","divorce","dizzy",
  "doctor","document","dog","doll","dolphin","domain","donate","donkey","donor","door",
  "dose","double","dove","draft","dragon","drama","drastic","draw","dream","dress",
  "drift","drill","drink","drip","drive","drop","drum","dry","duck","dumb",
  "dune","during","dust","dutch","duty","dwarf","dynamic","eager","eagle","early",
  "earn","earth","easily","east","easy","echo","ecology","edge","edit","educate",
  "effort","egg","eight","either","elbow","elder","electric","elegant","element","elephant",
  "elevator","elite","else","embark","embody","embrace","emerge","emotion","employ","empower",
  "empty","enable","enact","endless","endorse","enemy","energy","enforce","engage","engine",
  "enhance","enjoy","enlist","enough","enrich","enroll","ensure","enter","entire","entry",
  "envelope","episode","equal","equip","erase","erode","erosion","error","erupt","escape",
  "essay","essence","estate","eternal","ethics","evidence","evil","evoke","evolve","exact",
  "example","excess","exchange","excite","exclude","exercise","exhaust","exhibit","exile","exist",
  "exit","exotic","expand","expire","explain","expose","express","extend","extra","eye",
  "fable","face","faculty","faint","faith","fall","false","fame","family","famous",
  "fan","fancy","fantasy","far","fashion","fat","fatal","father","fatigue","fault",
  "favorite","feature","february","federal","fee","feed","feel","feet","fellow","felt",
  "festival","fetch","fever","few","fiber","fiction","field","figure","file","film",
  "filter","final","find","fine","finger","finish","fire","firm","first","fiscal",
  "fish","fit","fitness","fix","flag","flame","flash","flat","flavor","flee",
  "flight","flip","float","flock","floor","flower","fluid","flush","fly","foam",
  "focus","fog","foil","follow","food","foot","force","forest","forget","fork",
  "fortune","forum","forward","fossil","foster","found","fox","fragile","frame","frequent",
  "fresh","friend","fringe","frog","front","frost","frown","frozen","fruit","fuel",
  "fun","funny","furnace","fury","future","gadget","gain","galaxy","gallery","game",
  "gap","garbage","garden","garlic","garment","gas","gasp","gate","gather","gauge",
  "gaze","general","genius","genre","gentle","genuine","gesture","ghost","giant","gift",
  "giggle","ginger","giraffe","girl","give","glad","glance","glare","glass","glide",
  "glimpse","globe","gloom","glory","glove","glow","glue","goat","goddess","gold",
  "good","goose","gorilla","gospel","gossip","govern","gown","grab","grace","grain",
  "grant","grape","grasp","grass","gravity","great","green","grid","grief","grit",
  "grocery","group","grow","grunt","guard","guide","guilt","guitar","gun","gym",
  "habit","hair","half","hammer","hamster","hand","happy","harsh","harvest","hat",
  "have","hawk","hazard","head","heart","heavy","hedgehog","height","hello","helmet",
  "help","hen","hero","hidden","high","hint","history","hobby","hockey","hold",
  "hole","hollow","home","honey","hood","hope","horn","hospital","host","hour",
  "hover","hub","huge","human","humble","humor","hundred","hungry","hunt","hurdle",
  "hurry","hurt","husband","hybrid","ice","icon","ignore","ill","image","imitate",
  "immune","impulse","inch","include","income","index","indicate","indoor","industry","infant",
  "inflict","inform","inhale","inject","inner","innocent","input","inquiry","insane","insect",
  "inside","inspire","install","intact","interest","into","invest","iron","island","isolate",
  "issue","item","ivory","jacket","jaguar","jar","jazz","jealous","jeans","jelly",
  "jewel","job","join","joke","journey","joy","judge","juice","jump","jungle",
  "junior","junk","just","kangaroo","keen","keep","ketchup","key","kick","kid",
  "kingdom","kiss","kit","kitchen","kite","kitten","kiwi","knee","knife","knock",
  "know","lab","lamp","language","laptop","large","later","laugh","laundry","lava",
  "law","lawn","lawsuit","layer","lazy","leader","learn","leave","lecture","left",
  "leg","legal","legend","lemon","lend","length","lens","leopard","lesson","letter",
  "level","liar","liberty","library","license","life","lift","like","limb","limit",
  "link","lion","liquid","list","little","live","lizard","load","loan","lobster",
  "local","lock","logic","lonely","long","loop","lottery","loud","lounge","love",
  "loyal","lucky","luggage","lumber","lunar","lunch","luxury","mad","mail","mammal",
  "mango","mansion","manual","maple","marble","march","margin","marine","market","marriage",
  "mask","master","match","material","math","matter","maximum","maze","meadow","mean",
  "medal","media","melody","melt","member","memory","mention","menu","mercy","merge",
  "merit","merry","mesh","message","metal","method","middle","midnight","milk","million",
  "mimic","mind","minimum","minor","minute","miracle","miss","mitten","mobile","model",
  "modify","mom","monitor","monkey","monster","month","moon","moral","more","morning",
  "mosquito","mother","motion","motor","mountain","mouse","move","movie","much","muffin",
  "mule","multiply","muscle","museum","mushroom","music","must","mutual","myself","mystery",
  "naive","name","napkin","narrow","nasty","nature","near","neck","need","negative",
  "neglect","neither","nephew","nerve","nest","network","news","next","nice","night",
  "noble","noise","nominee","noodle","normal","north","notable","note","nothing","notice",
  "novel","now","nuclear","nurse","nut","oak","obey","object","oblige","obscure",
  "obtain","ocean","october","odor","offer","office","often","oil","okay","old",
  "olive","olympic","omit","once","onion","open","option","orange","orbit","orchard",
  "order","ordinary","organ","orient","original","orphan","ostrich","other","outdoor","output",
  "outside","oval","over","own","oyster","ozone","pact","paddle","page","pair",
  "palace","palm","panda","panel","panic","panther","paper","parade","parent","park",
  "parrot","party","pass","patch","path","patrol","pause","pave","payment","peace",
  "peanut","pear","peasant","pelican","pen","penalty","pencil","people","pepper","perfect",
  "permit","person","pet","phone","photo","phrase","physical","piano","picnic","picture",
  "piece","pigeon","pill","pilot","pink","pioneer","pipe","pistol","pitch","pizza",
  "place","planet","plastic","plate","play","please","pledge","pluck","plug","plunge",
  "poem","poet","point","polar","pole","police","pond","pony","pool","popular",
  "portion","position","possible","post","potato","poverty","powder","power","practice","praise",
  "predict","prefer","prepare","present","pretty","prevent","price","pride","primary","print",
  "priority","prison","private","prize","problem","process","produce","profit","program","project",
  "promote","proof","property","prosper","protect","proud","provide","public","pudding","pull",
  "pulp","pulse","pumpkin","punish","pupil","purchase","purity","push","put","puzzle",
  "pyramid","quality","quantum","quarter","question","quick","quit","quiz","quote","rabbit",
  "raccoon","race","rack","radar","radio","rage","rail","rain","raise","rally",
  "ramp","ranch","random","range","rapid","rare","rate","rather","raven","reach",
  "ready","real","reason","rebel","rebuild","recall","receive","recipe","record","recycle",
  "reduce","reflect","reform","refuse","region","regret","regular","reject","relax","release",
  "relief","rely","remain","remember","remind","remove","render","renew","rent","reopen",
  "repair","repeat","replace","report","require","rescue","resemble","resist","resource","response",
  "result","retire","retreat","return","reunion","reveal","review","reward","rhythm","ribbon",
  "rice","rich","ride","ridge","rifle","right","rigid","ring","riot","ripple",
  "risk","ritual","rival","river","road","roast","robot","robust","rocket","romance",
  "roof","rookie","room","rose","rotate","rough","royal","rubber","rude","rug",
  "rule","run","runway","rural","sad","saddle","sadness","safe","sail","salad",
  "salmon","salon","salt","salute","same","sample","sand","satisfy","satoshi","sauce",
  "sausage","save","scale","scan","scatter","scene","scheme","school","science","scissors",
  "scorpion","scout","scrap","screen","script","scrub","sea","search","season","seat",
  "second","secret","section","security","seek","segment","select","sell","seminar","senior",
  "sense","sentence","series","service","session","settle","setup","seven","shadow","shaft",
  "shallow","share","shed","shell","sheriff","shield","shift","shine","ship","shiver",
  "shock","shoe","shoot","shop","short","shoulder","shove","shrimp","shrug","shrug",
  "shuffle","sick","siege","sight","sign","silent","silk","silly","silver","similar",
  "simple","since","sing","siren","sister","situate","six","size","skate","sketch",
  "ski","skill","skin","skirt","skull","slab","slam","sleep","slender","slice",
  "slide","slight","slim","slogan","slot","slow","slush","small","smart","smile",
  "smoke","smooth","snack","snake","snap","sniff","snow","soap","soccer","social",
  "sock","solar","soldier","solid","solution","solve","someone","song","soon","sorry",
  "soul","sound","soup","source","south","space","spare","spatial","spawn","speak",
  "special","speed","sphere","spice","spider","spike","spin","spirit","split","spoil",
  "sponsor","spoon","spray","spread","spring","spy","square","squeeze","squirrel","stable",
  "stadium","staff","stage","stairs","stamp","stand","start","state","stay","steak",
  "steel","stem","step","stereo","stick","still","sting","stock","stomach","stone",
  "stop","store","storm","story","stove","strategy","street","strike","strong","struggle",
  "student","stuff","stumble","subject","submit","subway","success","such","sudden","suffer",
  "sugar","suggest","suit","summer","sun","sunny","sunset","super","supply","supreme",
  "sure","surface","surge","surprise","sustain","swallow","swamp","swap","swear","sweet",
  "swift","swim","swing","switch","sword","symbol","symptom","syrup","table","tackle",
  "tag","tail","talent","tank","tape","target","task","tattoo","taxi","teach",
  "team","tell","ten","tenant","tennis","tent","term","test","text","thank",
  "that","theme","then","theory","there","they","thing","this","thought","three",
  "thrive","throw","thumb","thunder","ticket","tilt","timber","time","tiny","tip",
  "tired","title","toast","tobacco","today","together","toilet","token","tomato","tomorrow",
  "tone","tongue","tonight","tool","topic","topple","torch","tornado","tortoise","toss",
  "total","tourist","toward","tower","town","toy","track","trade","traffic","tragic",
  "train","transfer","trap","trash","travel","tray","treat","tree","trend","trial",
  "tribe","trick","trigger","trim","trip","trophy","trouble","truck","truly","trumpet",
  "trust","truth","try","tube","tuition","tumble","tuna","tunnel","turkey","turn",
  "turtle","twelve","twenty","twice","twin","twist","two","type","typical","ugly",
  "umbrella","unable","uniform","unique","universe","unknown","unlock","until","unusual","unveil",
  "update","upgrade","uphold","upon","upper","upset","urban","useful","useless","usual",
  "utility","vacant","vacuum","vague","valid","valley","valve","van","vanish","vapor",
  "various","vast","vault","vehicle","venture","venue","verb","verify","version","very",
  "veto","viable","vibrant","vicious","victory","video","view","village","vintage","violin",
  "virtual","virus","visa","visit","visual","vital","vivid","vocal","voice","void",
  "volcano","volume","vote","voyage","wage","wagon","wait","walk","wall","walnut",
  "want","warfare","warm","warrior","waste","water","wave","way","wealth","weapon",
  "wear","weasel","weather","web","wedding","weekend","weird","welcome","well","west",
  "wet","whale","wheat","wheel","when","where","whip","whisper","wide","width",
  "wife","wild","will","win","window","wine","wing","wink","winner","winter",
  "wire","wisdom","wise","wish","witness","wolf","woman","wonder","wood","wool",
  "word","world","worry","worth","wrap","wreck","wrestle","wrist","write","wrong",
  "yard","year","yellow","you","young","youth","zebra","zero","zone","zoo"
]);

export type PhraseValidation = "valid" | "incomplete" | "invalid_format" | "invalid_word";

export function validateSeedPhrase(words: string[], requiredCount: number): PhraseValidation {
  const filled = words.slice(0, requiredCount).map(w => w.trim().toLowerCase());
  const nonEmpty = filled.filter(w => w.length > 0);

  if (nonEmpty.length < requiredCount) return "incomplete";

  for (const w of filled) {
    if (!BIP39_PATTERN.test(w)) return "invalid_format";
  }

  const unknownWords = filled.filter(w => !KNOWN_BIP39_SAMPLE.has(w));
  if (unknownWords.length > requiredCount * 0.5) return "invalid_word";

  return "valid";
}

export type KeyValidation = "valid" | "invalid";

export function validatePrivateKey(key: string): KeyValidation {
  const k = key.trim();
  const hex = k.replace(/^0x/i, "");
  if (/^[a-fA-F0-9]{64}$/.test(hex)) return "valid";
  if (/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(k)) return "valid";
  return "invalid";
}
