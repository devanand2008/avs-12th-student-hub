import { writeFileSync } from "node:fs";

interface RawQ {
  ch: number;
  qNum: number;
  qText: string;
  qTamil?: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  ans: "A" | "B" | "C" | "D";
  exp: string;
  expTamil?: string;
}

const botQuestions: RawQ[] = [
  // CHAPTER 1
  {
    ch: 1, qNum: 1,
    qText: "Choose the correct statement regarding reproduction in plants:",
    qTamil: "தாவரங்களில் இனப்பெருக்கம் தொடர்பான சரியான கூற்றைத் தேர்ந்தெடுக்கவும்:",
    optA: "Gametes are involved in asexual reproduction", optB: "Bacteria reproduce asexually by budding", optC: "Conidia formation is a method of sexual reproduction", optD: "Yeast reproduce asexually by budding",
    ans: "D",
    exp: "Yeast (Saccharomyces) typically reproduces asexually by budding where a small outgrowth develops into a new daughter cell.",
    expTamil: "ஈஸ்ட் மொட்டுவிடுதல் (Budding) மூலம் பாலிலா இனப்பெருக்கம் செய்கிறது."
  },
  {
    ch: 1, qNum: 2,
    qText: "An eminent Indian plant embryologist who popularized embryological techniques is:",
    qTamil: "புகழ்பெற்ற இந்திய தாவர கருவியல் அறிஞர் யார்?",
    optA: "S.R. Kashyap", optB: "P. Maheswari", optC: "M.S. Swaminathan", optD: "K.C. Mehta",
    ans: "B",
    exp: "Prof. P. Maheshwari was a world-renowned Indian botanist who authored 'An Introduction to the Embryology of Angiosperms'.",
    expTamil: "பேராசிரியர் பி. மகேஸ்வரி (P. Maheswari) புகழ்பெற்ற இந்திய கருவியல் அறிஞர் ஆவார்."
  },
  {
    ch: 1, qNum: 3,
    qText: "Identify the correctly matched vegetative propagation pair:",
    qTamil: "சரியாகப் பொருந்திய உடலப் பெருக்க இணையை அடையாளம் காண்க:",
    optA: "Tuber - Allium cepa", optB: "Sucker - Pistia", optC: "Rhizome - Musa", optD: "Stolon - Zingiber",
    ans: "C",
    exp: "Banana (Musa) propagates vegetatively via subterranean branched Rhizomes (or suckers).",
    expTamil: "மட்டநிலத்தண்டு - மூசா (Rhizome - Musa) சரியான இணையாகும்."
  },
  {
    ch: 1, qNum: 4,
    qText: "Pollen tube in flowering plants was first discovered by:",
    qTamil: "மகரந்தக் குழாயை முதலில் கண்டறிந்தவர் யார்?",
    optA: "J.G. Kolreuter", optB: "G.B. Amici", optC: "E. Strasburger", optD: "E. Hanning",
    ans: "B",
    exp: "G.B. Amici (1824) discovered the germination of pollen grain and the development of the pollen tube in Portulaca oleracea.",
    expTamil: "G.B. அமிசி (G.B. Amici) மகரந்தக் குழாயைக் கண்டுபிடித்தார்."
  },
  {
    ch: 1, qNum: 5,
    qText: "The smallest pollen grain size recorded in Myosotis is approximately:",
    qTamil: "மயோசோடிஸில் மிகச்சிறிய மகரந்தத்துகளின் அளவு தோராயமாக:",
    optA: "10 micrometer", optB: "2.5 to 10 micrometer", optC: "200 micrometer", optD: "2000 micrometer",
    ans: "A",
    exp: "Pollen grain of Myosotis measures about 10 µm across, which is among the smallest in angiosperms.",
    expTamil: "மயோசோடிஸ் மகரந்த துகள் சுமார் 10 மைக்ரோமீட்டர் விட்டம் கொண்டது."
  },
  {
    ch: 1, qNum: 6,
    qText: "The first cell of the male gametophyte in angiosperms is:",
    qTamil: "மூடுவிதைத் தாவரங்களில் ஆண் கேமிட்டோபைட்டின் முதல் செல் எது?",
    optA: "Microspore", optB: "Megaspore", optC: "Generative cell", optD: "Primary Endosperm Nucleus",
    ans: "A",
    exp: "The microspore (or uninucleate young pollen grain) is the initial cell of the male gametophyte generation.",
    expTamil: "நுண்வித்தி (Microspore) ஆண் கேமிட்டோபைட்டின் முதல் செல் ஆகும்."
  },
  {
    ch: 1, qNum: 7,
    qText: "The fibrous bands in the endothecium layer of anther are chemically composed of:",
    qTamil: "மகரந்தப்பையின் எண்டோதீசியம் அடுக்கில் உள்ள நார்ப்பட்டைகள் எதனால் ஆனவை?",
    optA: "Pectin", optB: "Alpha-Cellulose", optC: "Sporopollenin", optD: "Suberin",
    ans: "B",
    exp: "Radial walls of endothecium develop hygroscopic alpha-cellulose fibrous bands assisting in anther dehiscence.",
    expTamil: "ஆல்ஃபா-செல்லுலோஸ் (Alpha-Cellulose) நார்ப்பட்டைகள் எண்டோதீசியத்தில் உள்ளன."
  },
  {
    ch: 1, qNum: 8,
    qText: "Arrange the wall layers of the anther from inside (locule) to periphery (outside):",
    qTamil: "மகரந்தப்பை சுவர் அடுக்குகளை உள்ளிருந்து வெளிப்புறமாக வரிசைப்படுத்தவும்:",
    optA: "Epidermis, middle layers, tapetum, endothecium", optB: "Tapetum, middle layers, endothecium, epidermis", optC: "Endothecium, epidermis, middle layers, tapetum", optD: "Tapetum, middle layers, epidermis, endothecium",
    ans: "B",
    exp: "From inside out: Tapetum -> Middle layers -> Endothecium -> Epidermis.",
    expTamil: "உள்ளிருந்து வெளியே: டேப்பிட்டம் -> இடை அடுக்குகள் -> எண்டோதீசியம் -> எபிடெர்மிஸ்."
  },
  {
    ch: 1, qNum: 9,
    qText: "Identify the incorrect pair regarding plant reproduction structures:",
    qTamil: "தாவர இனப்பெருக்கம் தொடர்பான தவறான இணையை அடையாளம் காண்க:",
    optA: "sporopollenin - exine of pollen grain", optB: "tapetum - nutritive tissue for developing microspores", optC: "Nucellus - nutritive tissue for developing embryo", optD: "obturator - directs the pollen tube into micropyle",
    ans: "C",
    exp: "Endosperm (not nucellus) is the nutritive tissue for the developing embryo. Nucellus nourishes the embryo sac / megaspores.",
    expTamil: "கருவுக்கு ஊட்டமளிக்கும் திசு எண்டோஸ்பெர்ம் ஆகும், நியூசெல்லஸ் அல்ல."
  },
  {
    ch: 1, qNum: 10,
    qText: "Assertion: Sporopollenin preserves pollen in fossil deposits. Reason: Sporopollenin is resistant to physical and biological decomposition.",
    qTamil: "கூற்று: ஸ்போரோபோலினின் மகரந்தத்தை புதைபடிவங்களில் பாதுகாக்கிறது. காரணம்: இது இயற்பியல் மற்றும் உயிரியல் சிதைவுக்கு எதிர்ப்புத் திறன் கொண்டது.",
    optA: "Assertion is true; reason is false", optB: "Assertion is false; reason is true", optC: "Both Assertion and reason are not true", optD: "Both Assertion and reason are true, and Reason explains Assertion",
    ans: "D",
    exp: "Sporopollenin is an exceptionally stable oxidative polymer of carotenoids, rendering exine resistant to enzymes, heat, and acids.",
    expTamil: "கூற்று மற்றும் காரணம் இரண்டும் சரி, காரணம் கூற்றை விளக்குகிறது."
  },

  // CHAPTER 2
  {
    ch: 2, qNum: 1,
    qText: "Extra nuclear inheritance (cytoplasmic inheritance) is a consequence of the presence of genes in:",
    qTamil: "உட்கருவுக்கு அப்பாற்பட்ட பாரம்பரியம் எந்த உறுப்புகளில் உள்ள மரபணுக்களால் ஏற்படுகிறது?",
    optA: "Mitochondria and chloroplasts", optB: "Endoplasmic reticulum and mitochondria", optC: "Ribosomes and chloroplast", optD: "Lysosomes and ribosomes",
    ans: "A",
    exp: "Cytoplasmic genes are located in organellar DNA residing in mitochondria (mtDNA) and plastids/chloroplasts (cpDNA).",
    expTamil: "மைட்டோகாண்ட்ரியா மற்றும் பசுங்கணிகங்களில் (Mitochondria and chloroplasts) உள்ள மரபணுக்களால் ஏற்படுகிறது."
  },
  {
    ch: 2, qNum: 2,
    qText: "In order to find out the different types of gametes produced by a dihybrid plant with genotype AaBb, it should be crossed to:",
    qTamil: "AaBb மரபணு கொண்ட தாவரத்தால் உற்பத்தி செய்யப்படும் கேமிட்டுகளின் வகைகளைக் கண்டறிய எதனுடன் கலப்பு செய்ய வேண்டும்?",
    optA: "aaBB", optB: "AaBB", optC: "AABB", optD: "aabb",
    ans: "D",
    exp: "A test cross with a homozygous double recessive parent (aabb) reveals the exact gametic frequencies.",
    expTamil: "இரட்டை ஒடுங்கு பெற்றோரான aabb உடன் டெஸ்ட் கிராஸ் செய்ய வேண்டும்."
  },
  {
    ch: 2, qNum: 3,
    qText: "How many different kinds of gametes will be produced by a plant having the genotype AABbCc?",
    qTamil: "AABbCc மரபணு கொண்ட தாவரம் எத்தனை வகையான கேமிட்டுகளை உருவாக்கும்?",
    optA: "2", optB: "4", optC: "8", optD: "16",
    ans: "B",
    exp: "Number of gamete types = 2^n, where n is the number of heterozygous gene pairs. Here n=2 (Bb and Cc), so 2^2 = 4 gametes.",
    expTamil: "2^2 = 4 வகையான கேமிட்டுகள் உருவாகும்."
  },
  {
    ch: 2, qNum: 4,
    qText: "Which of the following phenotypic ratio was obtained by Mendel in a dihybrid cross?",
    qTamil: "மெண்டலின் இருபண்பு கலப்பில் பெறப்பட்ட புறத்தோற்ற விகிதம் எது?",
    optA: "9:3:3:1", optB: "1:2:1", optC: "3:1", optD: "9:7",
    ans: "A",
    exp: "A standard Mendelian dihybrid cross yields a phenotypic ratio of 9:3:3:1.",
    expTamil: "9:3:3:1 என்பது மெண்டலின் இருபண்பு கலப்பு விகிதமாகும்."
  },
  {
    ch: 2, qNum: 5,
    qText: "The phenotypic ratio of incomplete dominance in Mirabilis jalapa (4 o'clock plant) is:",
    qTamil: "மிராபிலிஸ் ஜலாபாவில் முழுமையற்ற ஓங்குதன்மையின் புறத்தோற்ற விகிதம் என்ன?",
    optA: "3:1", optB: "1:2:1", optC: "9:3:3:1", optD: "2:1",
    ans: "B",
    exp: "Incomplete dominance shows a 1 Red : 2 Pink : 1 White (1:2:1) phenotypic and genotypic ratio in F2.",
    expTamil: "1:2:1 என்பது முழுமையற்ற ஓங்குதன்மையின் விகிதமாகும்."
  },
  {
    ch: 2, qNum: 6,
    qText: "In Mirabilis jalapa, when red flowered plant is crossed with white flowered plant, the F1 progeny produces:",
    qTamil: "சிவப்பு மற்றும் வெள்ளை மலர் தாவரங்களை கலக்கும் போது F1 சந்ததி என்ன மலரைத் தரும்?",
    optA: "Red flowers", optB: "White flowers", optC: "Pink flowers", optD: "Variegated flowers",
    ans: "C",
    exp: "Due to incomplete dominance, heterozygous F1 plants have an intermediate pink flower phenotype.",
    expTamil: "இளஞ்சிவப்பு மலர்களை (Pink flowers) உருவாக்கும்."
  },
  {
    ch: 2, qNum: 7,
    qText: "Co-dominance is exemplified by which plant trait or biochemical pattern?",
    qTamil: "இணை ஓங்குதன்மைக்கு எடுத்துக்காட்டு எது?",
    optA: "ABO blood groups / Coat color / Flower color in Camellia", optB: "Tallness in pea", optC: "Starch grain synthesis in pea", optD: "Snapdragon color",
    ans: "A",
    exp: "In co-dominance, both alleles express equally and independently in the heterozygote without blending.",
    expTamil: "இரு அல்லீல்களும் சமமாக வெளிப்படும் நிகழ்வு இணை ஓங்குதன்மை ஆகும்."
  },
  {
    ch: 2, qNum: 8,
    qText: "Lethal genes in plants were first observed by E. Baur in:",
    qTamil: "தாவரங்களில் கொல்லும் மரபணுக்களை முதன்முதலில் கவனித்தவர் யார்?",
    optA: "Antirrhinum majus (Snapdragon)", optB: "Pisum sativum", optC: "Lathyrus odoratus", optD: "Mirabilis jalapa",
    ans: "A",
    exp: "Erwin Baur (1907) observed lethal aurea genes in Antirrhinum majus causing a 2:1 ratio.",
    expTamil: "ஆன்டிரைனம் மேஜஸ் (Antirrhinum majus) தாவரத்தில் கவனிக்கப்பட்டது."
  },
  {
    ch: 2, qNum: 9,
    qText: "When a single gene influences multiple phenotypic traits, this phenomenon is called:",
    qTamil: "ஒரே ஒரு மரபணு பல புறத்தோற்றப் பண்புகளை கட்டுப்படுத்துவது எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Pleiotropy", optB: "Polygenic inheritance", optC: "Epistasis", optD: "Atavism",
    ans: "A",
    exp: "Pleiotropy occurs when one gene influences two or more seemingly unrelated phenotypic traits.",
    expTamil: "பிளியோட்ரோபி (Pleiotropy - பல பண்பு மரபணு) எனப்படும்."
  },
  {
    ch: 2, qNum: 10,
    qText: "In duplicate recessive epistasis (complementary genes), the F2 dihybrid phenotypic ratio is modified to:",
    qTamil: "நிரப்பு மரபணுக்களில் F2 புறத்தோற்ற விகிதம் எவ்வாறு மாறுகிறது?",
    optA: "9:7", optB: "12:3:1", optC: "9:3:4", optD: "15:1",
    ans: "A",
    exp: "Complementary gene interaction (duplicate recessive epistasis) modifies the 9:3:3:1 ratio into 9:7.",
    expTamil: "9:7 விகிதமாக மாறுகிறது."
  },

  // CHAPTER 3
  {
    ch: 3, qNum: 1,
    qText: "An allohexaploid plant species (e.g., Triticum aestivum wheat) contains:",
    qTamil: "அலோஹெக்ஸாபிளாய்டு தாவரம் (கோதுமை) எதனைக் கொண்டுள்ளது?",
    optA: "Six copies of one genome", optB: "Two copies of three different ancestral genomes", optC: "Six different genomes", optD: "Four copies of one genome",
    ans: "B",
    exp: "Common bread wheat (2n=6x=42) has genomes AABBDD, comprising two copies each of three distinct ancestral genomes.",
    expTamil: "மூன்று வெவ்வேறு மரபணுக்களின் தலா இரு நகல்களைக் கொண்டுள்ளது."
  },
  {
    ch: 3, qNum: 2,
    qText: "The A and B genes are 10 cM apart on a chromosome. If an AB/ab heterozygote is testcrossed to ab/ab, how many progeny of each class are expected out of 100?",
    qTamil: "A மற்றும் B மரபணுக்கள் 10 cM தொலைவில் உள்ளன. AB/ab x ab/ab கலப்பில் 100 சந்ததிகளில் எதிர்பார்ப்பது என்ன?",
    optA: "25 AB, 25 ab, 25 Ab, 25 aB", optB: "10 AB, 10 ab", optC: "45 AB, 45 ab, 5 Ab, 5 aB", optD: "50 AB, 50 ab",
    ans: "C",
    exp: "10 cM = 10% recombinants (5 Ab + 5 aB) and 90% parentals (45 AB + 45 ab).",
    expTamil: "45 AB, 45 ab (பெற்றோர் வகை) மற்றும் 5 Ab, 5 aB (மறுசேர்க்கை வகை) கிடைக்கும்."
  },
  {
    ch: 3, qNum: 3,
    qText: "Who constructed the first genetic chromosome map in 1913?",
    qTamil: "1913-ல் முதல் மரபணு வரைபடத்தை உருவாக்கியவர் யார்?",
    optA: "Alfred Sturtevant", optB: "T.H. Morgan", optC: "Gregor Mendel", optD: "Bridges",
    ans: "A",
    exp: "Alfred Sturtevant, an undergraduate student of T.H. Morgan, constructed the first genetic map.",
    expTamil: "ஆல்ஃபிரட் ஸ்டர்ட்டிவன்ட் (Alfred Sturtevant) முதல் மரபணு வரைபடத்தை உருவாக்கினார்."
  },
  {
    ch: 3, qNum: 4,
    qText: "Exchange of genetic segments between non-sister chromatids of homologous chromosomes occurs during:",
    qTamil: "ஒத்த குரோமோசோம்களின் நான்-சிஸ்டர் குரோமேட்டிட்களுக்கு இடையே மரபணு பரிமாற்றம் எப்போது நடைபெறுகிறது?",
    optA: "Pachytene stage of Meiosis I", optB: "Leptotene stage", optC: "Diplotene stage", optD: "Metaphase II",
    ans: "A",
    exp: "Crossing over occurs during the pachytene sub-stage of Prophase I of meiosis.",
    expTamil: "குன்றல் பகுப்பு I-ன் பாக்கிட்டீன் (Pachytene) நிலையில் குறுக்கேற்றம் நடைபெறுகிறது."
  },
  {
    ch: 3, qNum: 5,
    qText: "Polyploidy induced artificially in plant breeding is commonly stimulated using which chemical alkaloid?",
    qTamil: "தாவரங்களில் செயற்கையாக பலமடிநிலையைத் தூண்ட பயன்படும் வேதிப்பொருள் எது?",
    optA: "Colchicine", optB: "Auxin", optC: "Gibberellin", optD: "Ethylene",
    ans: "A",
    exp: "Colchicine inhibits spindle microtubule formation during mitosis, inducing chromosome doubling.",
    expTamil: "கோல்ச்சிசின் (Colchicine) பலமடிநிலையைத் தூண்டுகிறது."
  },
  {
    ch: 3, qNum: 6,
    qText: "Point mutation involving replacement of a purine base by another purine is called:",
    qTamil: "ஒரு பியூரின் மற்றொரு பியூரினால் மாற்றப்படும் புள்ளி சடுதிமாற்றம்:",
    optA: "Transition", optB: "Transversion", optC: "Inversion", optD: "Translocation",
    ans: "A",
    exp: "Transition is the substitution of a purine by another purine (A <-> G) or pyrimidine by another pyrimidine (C <-> T).",
    expTamil: "டிரான்சிஷன் (Transition) எனப்படும்."
  },
  {
    ch: 3, qNum: 7,
    qText: "The chromosomal condition 2n - 1 is referred to as:",
    qTamil: "2n - 1 என்ற குரோமோசோம் நிலை எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Monosomy", optB: "Nullisomy", optC: "Trisomy", optD: "Tetrasomy",
    ans: "A",
    exp: "Loss of a single chromosome from a diploid set (2n-1) is termed Monosomy.",
    expTamil: "மோனோசோமி (Monosomy) எனப்படும்."
  },
  {
    ch: 3, qNum: 8,
    qText: "The chromosomal condition 2n + 1 is referred to as:",
    qTamil: "2n + 1 என்ற குரோமோசோம் நிலை எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Trisomy", optB: "Monosomy", optC: "Nullisomy", optD: "Tetrasomy",
    ans: "A",
    exp: "Gain of an extra chromosome to a diploid complement (2n+1) is called Trisomy.",
    expTamil: "டிரைசோமி (Trisomy) எனப்படும்."
  },
  {
    ch: 3, qNum: 9,
    qText: "Which organism is popularly called the 'Cinderella of Genetics'?",
    qTamil: "'மரபியலின் சிண்ட்ரெல்லா' என்று பிரபலமாக அழைக்கப்படும் உயிரினம் எது?",
    optA: "Neurospora crassa", optB: "Drosophila melanogaster", optC: "Pisum sativum", optD: "Arabidopsis thaliana",
    ans: "A",
    exp: "The pink bread mold Neurospora crassa is called the Cinderella of Genetics due to its ideal tetrad analysis.",
    expTamil: "நியூரோஸ்போரா கிராஸா (Neurospora crassa) மரபியலின் சிண்ட்ரெல்லா எனப்படுகிறது."
  },
  {
    ch: 3, qNum: 10,
    qText: "When chromosomes break and a segment rotates by 180 degrees before rejoining, the mutation is:",
    qTamil: "ஒரு குரோமோசோம் துண்டு 180 டிகிரி சுழன்று மீண்டும் இணைந்தால் அது:",
    optA: "Inversion", optB: "Translocation", optC: "Duplication", optD: "Deletion",
    ans: "A",
    exp: "Inversion occurs when a chromosome segment breaks, flips 180°, and rejoins within the same chromosome.",
    expTamil: "தலைகீழாதல் (Inversion) சடுதிமாற்றம் எனப்படும்."
  },

  // CHAPTER 4
  {
    ch: 4, qNum: 1,
    qText: "Restriction endonucleases are enzymes that:",
    qTamil: "ரெஸ்ட்ரிக்ஷன் எண்டோநியூக்ளியேஸ் நொதிகள் என்பவை:",
    optA: "Are molecular scissors that cleave DNA at specific palindromic sequences", optB: "Join DNA fragments together", optC: "Synthesize RNA from DNA", optD: "Degrade proteins",
    ans: "A",
    exp: "Restriction endonucleases cleave phosphodiester bonds at specific palindromic recognition sites.",
    expTamil: "டிஎன்ஏ-வை குறிப்பிட்ட இடங்களில் துண்டிக்கும் மூலக்கூறு கத்தரிக்கோல்கள் ஆகும்."
  },
  {
    ch: 4, qNum: 2,
    qText: "Plasmids used as cloning vectors in genetic engineering are:",
    qTamil: "மரபணு பொறியியலில் குளோனிங் தாங்கிகளாக பயன்படும் பிளாஸ்மிடுகள் என்பவை:",
    optA: "Small, extra-chromosomal, self-replicating circular double-stranded DNA molecules", optB: "Linear RNA strands", optC: "Bacterial cell wall proteins", optD: "Viruses",
    ans: "A",
    exp: "Plasmids are autonomous circular extrachromosomal DNA molecules found in bacteria.",
    expTamil: "தன்னிச்சையாக பெருகும் வட்ட வடிவ டிஎன்ஏ மூலக்கூறுகள் ஆகும்."
  },
  {
    ch: 4, qNum: 3,
    qText: "The restriction enzyme EcoRI recognizes and cleaves which specific palindromic sequence?",
    qTamil: "EcoRI நொதி எந்த பாலின்ட்ரோம் வரிசையை அடையாளம் கண்டு துண்டிக்கிறது?",
    optA: "5'-GAATTC-3'", optB: "5'-AGGGTT-3'", optC: "5'-GTATATC-3'", optD: "5'-TATAGC-3'",
    ans: "A",
    exp: "EcoRI recognizes 5'-GAATTC-3' and cleaves between G and A, generating cohesive sticky ends.",
    expTamil: "5'-GAATTC-3' வரிசையை அடையாளம் கண்டு துண்டிக்கிறது."
  },
  {
    ch: 4, qNum: 4,
    qText: "Which enzyme is known as 'molecular glue' in recombinant DNA technology?",
    qTamil: "மறுசேர்க்கை டிஎன்ஏ தொழில்நுட்பத்தில் 'மூலக்கூறு பசை' என்று அழைக்கப்படும் நொதி எது?",
    optA: "DNA Ligase", optB: "DNA Polymerase", optC: "Amylase", optD: "Helicase",
    ans: "A",
    exp: "DNA Ligase joins Okazaki or recombinant DNA fragments by forming covalent phosphodiester bonds.",
    expTamil: "டிஎன்ஏ லிகேஸ் (DNA Ligase) மூலக்கூறு பசை எனப்படுகிறது."
  },
  {
    ch: 4, qNum: 5,
    qText: "Polymerase Chain Reaction (PCR) technique was invented in 1983 by:",
    qTamil: "PCR தொழில்நுட்பத்தை 1983-ல் கண்டுபிடித்தவர் யார்?",
    optA: "Kary Mullis", optB: "Paul Berg", optC: "Herbert Boyer", optD: "Stanley Cohen",
    ans: "A",
    exp: "Kary Mullis developed PCR for in vitro enzymatic amplification of DNA fragments.",
    expTamil: "கேரி முல்லிஸ் (Kary Mullis) PCR-ஐ கண்டுபிடித்தார்."
  },
  {
    ch: 4, qNum: 6,
    qText: "The heat-stable DNA polymerase used in automated PCR is isolated from which thermophilic bacterium?",
    qTamil: "PCR-ல் பயன்படும் வெப்பத்தைத் தாங்கும் Taq பாலிமரேஸ் எந்த பாக்டீரியாவிலிருந்து பெறப்படுகிறது?",
    optA: "Thermus aquaticus", optB: "Escherichia coli", optC: "Bacillus subtilis", optD: "Agrobacterium tumefaciens",
    ans: "A",
    exp: "Taq polymerase is isolated from the thermophilic bacterium Thermus aquaticus.",
    expTamil: "தெர்மஸ் அக்வாடிகஸ் (Thermus aquaticus) பாக்டீரியாவிலிருந்து பெறப்படுகிறது."
  },
  {
    ch: 4, qNum: 7,
    qText: "Which bacterium is natural genetic engineer of plants widely used for plant transformation?",
    qTamil: "தாவரங்களில் மரபணு மாற்றத்திற்கு பரவலாக பயன்படும் 'இயற்கை மரபணு பொறியியலாளர்' எது?",
    optA: "Agrobacterium tumefaciens", optB: "Rhizobium leguminosarum", optC: "Escherichia coli", optD: "Pseudomonas putida",
    ans: "A",
    exp: "Agrobacterium tumefaciens transfers its Ti-plasmid T-DNA naturally into plant genomes.",
    expTamil: "அக்ரோபாக்டீரியம் டுமிஃபேசியன்ஸ் (Agrobacterium tumefaciens) ஆகும்."
  },
  {
    ch: 4, qNum: 8,
    qText: "In gel electrophoresis, DNA fragments move towards which electrode and why?",
    qTamil: "ஜெல் எலக்ட்ரோபோரிசிஸில் டிஎன்ஏ துண்டுகள் எந்த மின்முனையை நோக்கி நகர்கின்றன?",
    optA: "Anode (+ve) because DNA is negatively charged", optB: "Cathode (-ve) because DNA is positively charged", optC: "Both directions", optD: "Does not move",
    ans: "A",
    exp: "Due to negatively charged phosphate backbones, DNA fragments migrate towards the positive anode (+).",
    expTamil: "எதிர்மின் சுமை கொண்டதால் நேர்மின்முனையை (Anode) நோக்கி நகர்கின்றன."
  },
  {
    ch: 4, qNum: 9,
    qText: "Southern blotting technique is specifically used for the detection of:",
    qTamil: "சதர்ன் பிளாட்டிங் தொழில்நுட்பம் எதனை கண்டறிய பயன்படுகிறது?",
    optA: "DNA sequences", optB: "RNA sequences", optC: "Proteins", optD: "Lipids",
    ans: "A",
    exp: "Southern blot detects DNA, Northern blot detects RNA, and Western blot detects proteins.",
    expTamil: "டிஎன்ஏ (DNA) வரிசைகளைக் கண்டறிய பயன்படுகிறது."
  },
  {
    ch: 4, qNum: 10,
    qText: "pBR322 is a widely used cloning vector. What does 'BR' stand for?",
    qTamil: "pBR322 தாங்கியில் 'BR' என்பது எதனைக் குறிக்கிறது?",
    optA: "Bolivar and Rodriguez", optB: "Boyer and Roberts", optC: "Bacterial Recombinant", optD: "Biochemical Research",
    ans: "A",
    exp: "pBR322 was named after its developers Francisco Bolivar and Raymond Rodriguez.",
    expTamil: "பொலிவர் மற்றும் ரோட்ரிக்ஸ் (Bolivar and Rodriguez) பெயரைக் குறிக்கிறது."
  },

  // CHAPTER 5
  {
    ch: 5, qNum: 1,
    qText: "Totipotency refers to the:",
    qTamil: "முழுத்திறன் (Totipotency) என்பது எதனைக் குறிக்கிறது?",
    optA: "Capacity of an isolated single plant cell/explant to regenerate into a whole complete plant", optB: "Capacity to produce seeds", optC: "Resistance to diseases", optD: "Production of flowers",
    ans: "A",
    exp: "Cellular totipotency is the intrinsic capacity of a living plant cell to regenerate into an entire plant organism.",
    expTamil: "ஒரு தாவர செல்லிலிருந்து முழு தாவரத்தையும் உருவாக்கும் உள்ளார்ந்த திறன்."
  },
  {
    ch: 5, qNum: 2,
    qText: "Who first proposed the concept of cellular totipotency in plants in 1902?",
    qTamil: "1902-ல் தாவர செல்களின் முழுத்திறன் கோட்பாட்டை முதலில் முன்மொழிந்தவர் யார்?",
    optA: "Gottlieb Haberlandt", optB: "F.C. Steward", optC: "Murashige", optD: "Skoog",
    ans: "A",
    exp: "Gottlieb Haberlandt proposed cellular totipotency in 1902 and is regarded as the Father of Plant Tissue Culture.",
    expTamil: "காட்லீப் ஹேபர்லேண்ட் (Gottlieb Haberlandt) முன்மொழிந்தார்."
  },
  {
    ch: 5, qNum: 3,
    qText: "The most widely used synthetic nutrient formulation in plant tissue culture is:",
    qTamil: "தாவர திசு வளர்ப்பில் மிகவும் பரவலாகப் பயன்படும் ஊட்ட ஊடகம் எது?",
    optA: "MS medium (Murashige and Skoog medium)", optB: "Knop's medium", optC: "White's medium", optD: "Hoagland solution",
    ans: "A",
    exp: "Murashige and Skoog (MS) medium formulated in 1962 is the global standard nutrient medium for plant tissue culture.",
    expTamil: "MS ஊடகம் (Murashige and Skoog medium) மிகவும் பிரபலமானது."
  },
  {
    ch: 5, qNum: 4,
    qText: "An unorganized, undifferentiated proliferating mass of cells produced in tissue culture is called:",
    qTamil: "திசு வளர்ப்பில் உருவாகும் வேறுபாடடையாத செல்களின் திரள் எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Callus", optB: "Explant", optC: "Embryoid", optD: "Somaclone",
    ans: "A",
    exp: "Callus is an unorganized proliferating mass of parenchymatous cells formed on solid culture medium.",
    expTamil: "கேலஸ் (Callus) என அழைக்கப்படுகிறது."
  },
  {
    ch: 5, qNum: 5,
    qText: "Induction of root differentiation (rhizogenesis) in tissue culture is stimulated by a high ratio of:",
    qTamil: "திசு வளர்ப்பில் வேர் உருவாவதை (ரைசோஜெனிசிஸ்) தூண்டுவது எது?",
    optA: "Auxin to Cytokinin", optB: "Cytokinin to Auxin", optC: "Gibberellin to ABA", optD: "Ethylene",
    ans: "A",
    exp: "High auxin:cytokinin ratio promotes root initiation, while high cytokinin:auxin ratio induces shoot morphogenesis.",
    expTamil: "ஆக்சின் மற்றும் சைட்டோகைனின் அதிக விகிதம் வேர் உருவாவதை தூண்டுகிறது."
  },
  {
    ch: 5, qNum: 6,
    qText: "Protoplasts from plant cells are isolated enzymatically using which combination of enzymes?",
    qTamil: "புரோட்டோபிளாஸ்ட்களை தனிமைப்படுத்த பயன்படும் நொதிகள் எவை?",
    optA: "Cellulase and Pectinase", optB: "Lipase and Protease", optC: "DNAse and RNAse", optD: "Ligase and Amylase",
    ans: "A",
    exp: "Cellulase digests cellulose cell walls, and pectinase dissolves the middle lamella cementing cells together.",
    expTamil: "செல்லுலேஸ் மற்றும் பெக்டினேஸ் (Cellulase and Pectinase) நொதிகள்."
  },
  {
    ch: 5, qNum: 7,
    qText: "Chemical fusogen widely used for protoplast fusion in somatic hybridization is:",
    qTamil: "புரோட்டோபிளாஸ்ட் இணைவிற்கு பயன்படும் வேதிப்பொருள் எது?",
    optA: "Polyethylene glycol (PEG)", optB: "Colchicine", optC: "Glycerol", optD: "Formaldehyde",
    ans: "A",
    exp: "Polyethylene glycol (PEG) promotes membrane aggregation and cytoplasmic fusion between isolated plant protoplasts.",
    expTamil: "பாலிஎதிலீன் கிளைக்கால் (PEG) புரோட்டோபிளாஸ்ட் இணைவிற்கு பயன்படுகிறது."
  },
  {
    ch: 5, qNum: 8,
    qText: "Cryopreservation of plant germplasm is carried out at what ultra-low temperature in liquid nitrogen?",
    qTamil: "திரவ நைட்ரஜனில் எந்த மிகக் குறைந்த வெப்பநிலையில் உறைநிலை பாதுகாப்பு (Cryopreservation) செய்யப்படுகிறது?",
    optA: "-196 °C", optB: "-80 °C", optC: "-20 °C", optD: "0 °C",
    ans: "A",
    exp: "Cryopreservation stores biological tissues in liquid nitrogen at -196 °C (-320 °F) arresting metabolic processes.",
    expTamil: "-196 °C வெப்பநிலையில் திரவ நைட்ரஜனில் சேமிக்கப்படுகிறது."
  },
  {
    ch: 5, qNum: 9,
    qText: "Virus-free plants are successfully obtained through culture of which plant tissue?",
    qTamil: "வைரஸ் இல்லாத ஆரோக்கியமான தாவரங்களை பெற எந்த திசு வளர்க்கப்படுகிறது?",
    optA: "Apical meristem", optB: "Pith cells", optC: "Bark", optD: "Root tip cortex",
    ans: "A",
    exp: "Shoot apical meristems lack vascular connection and have high metabolic rates, remaining free from viral infection.",
    expTamil: "நுனி ஆக்குதிசு (Apical meristem) மூலம் வைரஸ் அற்ற தாவரங்கள் பெறப்படுகின்றன."
  },
  {
    ch: 5, qNum: 10,
    qText: "Artificial synthetic seeds are encapsulated somatic embryos coated with:",
    qTamil: "செயற்கை விதைகள் உடலக் கருக்களை எதனால் பூசப்பட்டு உருவாக்கப்படுகின்றன?",
    optA: "Sodium alginate", optB: "Agarose", optC: "Gelatin", optD: "Pectin",
    ans: "A",
    exp: "Synthetic seeds are produced by encapsulating somatic embryos or shoot buds in 2-3% sodium alginate and CaCl2 beads.",
    expTamil: "சோடியம் ஆல்ஜினேட் (Sodium alginate) கொண்டு பூசப்படுகின்றன."
  },

  // CHAPTER 6: Principles of Ecology
  {
    ch: 6, qNum: 1,
    qText: "Arrange the correct sequence of ecological hierarchy starting from lower to higher level:",
    qTamil: "சூழ்நிலையியல் படிநிலையை கீழிருந்து மேலாக சரியாக வரிசைப்படுத்துக:",
    optA: "Individual organism -> Population -> Community -> Ecosystem -> Landscape -> Biome -> Biosphere",
    optB: "Landscape -> Ecosystem -> Biome -> Biosphere",
    optC: "community -> Ecosystem -> Landscape -> Biome",
    optD: "Population -> organism -> Biome -> Landscape",
    ans: "A",
    exp: "Ecological hierarchy spans: Organism -> Population -> Biological Community -> Ecosystem -> Landscape -> Biome -> Biosphere.",
    expTamil: "தனி உயிரி -> சிற்றினம்/இனக்கூட்டம் -> சமூகம் -> சூழ்நிலை மண்டலம் -> நிலப்பரப்பு -> பயோம் -> உயிர்க்கோளம்."
  },
  {
    ch: 6, qNum: 2,
    qText: "The study of an individual species in relation to its environment is called:",
    qTamil: "ஒரு தனிப்பட்ட சிற்றினத்தை அதன் சூழலுடன் தொடர்புபடுத்தி படிப்பது எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Autecology", optB: "Synecology", optC: "Community ecology", optD: "Ecosystem ecology",
    ans: "A",
    exp: "Autecology (species ecology) is the study of the ecological relations of a single individual or single species.",
    expTamil: "சுயசூழலியல் (Autecology) என அழைக்கப்படுகிறது."
  },
  {
    ch: 6, qNum: 3,
    qText: "Plants adapted to live in dry habitats with scarce water availability are called:",
    qTamil: "நீர்ப்பற்றாக்குறை உள்ள வறண்ட நிலங்களில் வாழ தகவமைந்த தாவரங்கள்:",
    optA: "Xerophytes", optB: "Hydrophytes", optC: "Mesophytes", optD: "Halophytes",
    ans: "A",
    exp: "Xerophytes possess thick cuticles, sunken stomata, and succulent water-storing tissues (e.g., Opuntia, Aloe).",
    expTamil: "வறண்ட நிலத் தாவரங்கள் (Xerophytes) எனப்படும்."
  },
  {
    ch: 6, qNum: 4,
    qText: "Plants which grow in saline soil or water with high salt concentration are termed:",
    qTamil: "அதிக உப்புத்தன்மை கொண்ட உவர்நிலங்களில் வளரும் தாவரங்கள்:",
    optA: "Halophytes", optB: "Hydrophytes", optC: "Xerophytes", optD: "Epiphytes",
    ans: "A",
    exp: "Halophytes (e.g., Rhizophora, Avicennia) thrive in saline environments, showing pneumatophores and vivipary.",
    expTamil: "உவர்நிலத் தாவரங்கள் (Halophytes) எனப்படும்."
  },
  {
    ch: 6, qNum: 5,
    qText: "Pneumatophores (respiratory roots) that grow vertically upward for gaseous exchange are characteristic of:",
    qTamil: "சுவாச வேர்கள் (Pneumatophores) எந்த தாவரங்களின் சிறப்பியல்பு?",
    optA: "Mangrove halophytes (Rhizophora)", optB: "Xerophytes", optC: "Submerged hydrophytes", optD: "Parasites",
    ans: "A",
    exp: "Mangrove plants in waterlogged saline soils produce negative geotropic roots called pneumatophores for aeration.",
    expTamil: "சதுப்புநில உவர் தாவரங்கள் (Rhizophora) சுவாச வேர்களைக் கொண்டுள்ளன."
  },
  {
    ch: 6, qNum: 6,
    qText: "Vivipary (germination of seed while still attached to the parent plant) is an adaptation found in:",
    qTamil: "தாய் தாவரத்துடன் இணைந்திருக்கும் போதே விதை முளைக்கும் கனிக்குள் வித்து முளைத்தல் (Vivipary) எதில் காணப்படுகிறது?",
    optA: "Rhizophora (Mangroves)", optB: "Hydrilla", optC: "Opuntia", optD: "Casuarina",
    ans: "A",
    exp: "Viviparous germination prevents seeds from drowning in salt marsh water or being swept away by tides.",
    expTamil: "சதுப்புநில தாவரமான ரைசோஃபோராவில் (Rhizophora) காணப்படுகிறது."
  },
  {
    ch: 6, qNum: 7,
    qText: "Epiphytic roots of Vanda possess a specialized hygroscopic spongy tissue called:",
    qTamil: "வாண்டா தாவரத்தின் தொற்றுவேர்களில் ஈரப்பதத்தை உறிஞ்சும் பஞ்சு போன்ற திசு எது?",
    optA: "Velamen tissue", optB: "Phelloderm", optC: "Endodermis", optD: "Periderm",
    ans: "A",
    exp: "Velamen is a multi-layered spongy epidermis that absorbs moisture and water vapor directly from the atmosphere.",
    expTamil: "வெலமன் திசு (Velamen tissue) ஈரப்பதத்தை உறிஞ்சுகிறது."
  },
  {
    ch: 6, qNum: 8,
    qText: "Sunken stomata in leaves covered with hair are prominent anatomical xerophytic adaptations seen in:",
    qTamil: "இலைகளில் உட்குழிந்த இலைத்துளைகள் காணப்படும் வறண்ட நில தாவரம் எது?",
    optA: "Nerium", optB: "Nymphaea", optC: "Vallisneria", optD: "Hydrilla",
    ans: "A",
    exp: "Nerium leaves have stomata restricted to sunken stomatal crypts lined with epidermal trichomes to minimize transpiration.",
    expTamil: "நெரியம் (Nerium) தாவரத்தில் உட்குழிந்த இலைத்துளைகள் உள்ளன."
  },
  {
    ch: 6, qNum: 9,
    qText: "Pedology is the scientific study of:",
    qTamil: "மண்ணியல் (Pedology) என்பது எதனைப் பற்றிய அறிவியல் ஆய்வு?",
    optA: "Soil", optB: "Rocks", optC: "Water", optD: "Fossils",
    ans: "A",
    exp: "Pedology is the branch of soil science focusing on the formation, morphology, and classification of soils.",
    expTamil: "மண் (Soil) பற்றிய அறிவியல் ஆய்வு ஆகும்."
  },
  {
    ch: 6, qNum: 10,
    qText: "The interaction between orchid and mango tree where orchid derives physical support without harming or nourishing the tree is:",
    qTamil: "ஆர்க்கிட் மற்றும் மாமரத்திற்கு இடையிலான தொடர்பு:",
    optA: "Commensalism (+, 0)", optB: "Mutualism (+, +)", optC: "Parasitism (+, -)", optD: "Amensalism (-, 0)",
    ans: "A",
    exp: "In commensalism, one organism benefits while the other is neither helped nor harmed.",
    expTamil: "உடனுண்ணும் வாழ்க்கை (Commensalism) எனப்படும்."
  },

  // CHAPTER 7: Ecosystem
  {
    ch: 7, qNum: 1,
    qText: "Which of the following is an abiotic component of the ecosystem?",
    qTamil: "சூழ்நிலை மண்டலத்தின் உயிரற்ற கூறு எது?",
    optA: "Humus and minerals", optB: "Bacteria", optC: "Fungi", optD: "Phytoplankton",
    ans: "A",
    exp: "Abiotic components include non-living physical and chemical factors like light, temperature, soil, humus, and minerals.",
    expTamil: "மக்காத கரிமப் பொருட்கள் மற்றும் தாதுக்கள் (Humus and minerals)."
  },
  {
    ch: 7, qNum: 2,
    qText: "Which of the following is an artificial man-made ecosystem?",
    qTamil: "செயற்கையான மனிதனால் உருவாக்கப்பட்ட சூழ்நிலை மண்டலம் எது?",
    optA: "Rice field / Crop field", optB: "Forest ecosystem", optC: "Grassland ecosystem", optD: "Desert ecosystem",
    ans: "A",
    exp: "Croplands and paddy fields are agro-ecosystems engineered and maintained by humans.",
    expTamil: "நெல் வயல் (Rice field) ஒரு செயற்கை சூழ்நிலை மண்டலம் ஆகும்."
  },
  {
    ch: 7, qNum: 3,
    qText: "A pond is a classic example of a:",
    qTamil: "குளம் எதற்கு சிறந்த எடுத்துக்காட்டு?",
    optA: "Lentic (standing freshwater) ecosystem", optB: "Lotic (running water) ecosystem", optC: "Marine ecosystem", optD: "Terrestrial ecosystem",
    ans: "A",
    exp: "Lentic ecosystems refer to stationary or calm freshwater bodies such as ponds, lakes, and marshes.",
    expTamil: "நிலையான நன்னீர் (Lentic) சூழ்நிலை மண்டலம்."
  },
  {
    ch: 7, qNum: 4,
    qText: "In an ecosystem, the trophic level of green plants (autotrophs) is designated as:",
    qTamil: "சூழ்நிலை மண்டலத்தில் பசுந்தாவரங்களின் ஊட்ட நிலை எது?",
    optA: "T1 (Producers)", optB: "T2 (Primary consumers)", optC: "T3 (Secondary consumers)", optD: "T4 (Tertiary consumers)",
    ans: "A",
    exp: "Primary producers (green photosynthetic plants) occupy the first trophic level T1.",
    expTamil: "முதல் ஊட்ட நிலை T1 (உற்பத்தியாளர்கள்)."
  },
  {
    ch: 7, qNum: 5,
    qText: "The 10% law of energy transfer between successive trophic levels in an ecosystem was proposed in 1942 by:",
    qTamil: "10% ஆற்றல் மாற்ற விதியை 1942-ல் முன்மொழிந்தவர் யார்?",
    optA: "Raymond Lindeman", optB: "Arthur Tansley", optC: "E.P. Odum", optD: "Charles Elton",
    ans: "A",
    exp: "Raymond Lindeman formulated the 10% law, stating that only about 10% of energy is transferred to the next trophic level.",
    expTamil: "ரேமண்ட் லிண்ட்மேன் (Raymond Lindeman) முன்மொழிந்தார்."
  },
  {
    ch: 7, qNum: 6,
    qText: "The ecological pyramid of energy is always:",
    qTamil: "ஆற்றல் பிரமிடு எப்போதும் எவ்வாறு இருக்கும்?",
    optA: "Always upright", optB: "Always inverted", optC: "Spindle-shaped", optD: "Irregular",
    ans: "A",
    exp: "Because energy is lost as metabolic heat at every transfer step (second law of thermodynamics), energy pyramids are always strictly upright.",
    expTamil: "எப்போதும் நேரானதாக (Always upright) மட்டுமே இருக்கும்."
  },
  {
    ch: 7, qNum: 7,
    qText: "In an ocean/pond ecosystem, the pyramid of biomass is typically:",
    qTamil: "கடல் அல்லது குளம் சூழ்நிலை மண்டலத்தில் உயிர்த்திரள் பிரமிடு பொதுவாக:",
    optA: "Inverted", optB: "Upright", optC: "Bell-shaped", optD: "Horizontal",
    ans: "A",
    exp: "Phytoplankton have high turnover rates and lower instantaneous biomass than the zooplankton and fish feeding upon them, making the biomass pyramid inverted.",
    expTamil: "தலைகீழானதாக (Inverted) இருக்கும்."
  },
  {
    ch: 7, qNum: 8,
    qText: "Who coined the term 'Ecosystem' in 1935?",
    qTamil: "1935-ல் 'சூழ்நிலை மண்டலம்' (Ecosystem) என்ற சொல்லை உருவாக்கியவர் யார்?",
    optA: "A.G. Tansley", optB: "E.P. Odum", optC: "Reiter", optD: "Ernst Haeckel",
    ans: "A",
    exp: "Sir Arthur G. Tansley coined the term 'ecosystem' in 1935.",
    expTamil: "ஏ.ஜி. டான்ஸ்லி (A.G. Tansley) உருவாக்கினார்."
  },
  {
    ch: 7, qNum: 9,
    qText: "Primary succession that begins on bare rock devoid of any prior soil is termed:",
    qTamil: "வெற்றுப் பாறைகளில் தொடங்கும் முதல்நிலை வழிமுறை வளர்ச்சி:",
    optA: "Xerosere (Lithosere)", optB: "Hydrosere", optC: "Psammosere", optD: "Halosere",
    ans: "A",
    exp: "A lithosere is a plant succession that originates on bare newly exposed rock surfaces.",
    expTamil: "லித்தோசீர் / பாறை வழிமுறை வளர்ச்சி (Lithosere)."
  },
  {
    ch: 7, qNum: 10,
    qText: "The pioneer species that initiate primary ecological succession on bare rocks are typically:",
    qTamil: "வெற்றுப் பாறைகளில் வழிமுறை வளர்ச்சியைத் தொடங்கும் முன்னோடி உயிரினங்கள் எவை?",
    optA: "Crustose Lichens", optB: "Mosses", optC: "Annual grasses", optD: "Shrubs",
    ans: "A",
    exp: "Crustose lichens (such as Rhizocarpon, Lecanora) secrete organic acids that etch rocks to form the earliest soil.",
    expTamil: "மேலோட்டு லைக்கன்கள் (Crustose Lichens) முன்னோடி உயிரினங்கள் ஆகும்."
  },

  // CHAPTER 8: Environmental Issues
  {
    ch: 8, qNum: 1,
    qText: "Which of the following would most likely help to mitigate the greenhouse effect?",
    qTamil: "பசுமை இல்ல விளைவைக் குறைக்க எது மிகவும் உதவும்?",
    optA: "Afforestation and reforestation to sequester carbon dioxide",
    optB: "Clearing forests for grazing land",
    optC: "Burning fossil fuels",
    optD: "Increasing private vehicle usage",
    ans: "A",
    exp: "Trees act as massive carbon sinks through photosynthetic carbon sequestration, absorbing atmospheric CO2.",
    expTamil: "காடுகளை வளர்த்து கார்பன் டை ஆக்சைடை நிலைநிறுத்துதல்."
  },
  {
    ch: 8, qNum: 2,
    qText: "With respect to Eichhornia crassipes (Water Hyacinth), which statement is correct?",
    qTamil: "ஆகாயத்தாமரை (Eichhornia crassipes) பற்றிய சரியான கூற்று எது?",
    optA: "It is an invasive exotic aquatic weed ('Terror of Bengal') that depletes dissolved oxygen",
    optB: "It is an indigenous marine plant",
    optC: "It enriches oxygen in ponds",
    optD: "It is an endangered medicinal fern",
    ans: "A",
    exp: "Eichhornia was introduced from South America and rapidly clogs water bodies, causing severe eutrophication and fish asphyxiation.",
    expTamil: "இது ஆக்ஸிஜனை உறிஞ்சி நீர்வாழ் உயிரினங்களை அழிக்கும் ஆக்கிரமிப்பு களை ஆகும்."
  },
  {
    ch: 8, qNum: 3,
    qText: "The primary chemical gases responsible for anthropogenic stratospheric ozone depletion are:",
    qTamil: "ஓசோன் படல சிதைவுக்கு காரணமான முதன்மை வாயுக்கள் எவை?",
    optA: "Chlorofluorocarbons (CFCs)", optB: "Methane and Argon", optC: "Carbon monoxide", optD: "Oxygen",
    ans: "A",
    exp: "CFCs release reactive chlorine free radicals under UV irradiation, which catalytically destroy ozone (O3) molecules.",
    expTamil: "குளோரோபுளோரோகார்பன்கள் (CFCs) ஓசோன் படலத்தை சிதைக்கின்றன."
  },
  {
    ch: 8, qNum: 4,
    qText: "Acid rain is primarily caused by atmospheric emissions of:",
    qTamil: "அமில மழைக்கு காரணமான முதன்மை வளிமண்டல வாயுக்கள் எவை?",
    optA: "Sulfur dioxide (SO2) and Nitrogen oxides (NOx)", optB: "Carbon dioxide and Helium", optC: "Methane", optD: "Ozone",
    ans: "A",
    exp: "SO2 and NOx react with water vapor to form sulfuric acid (H2SO4) and nitric acid (HNO3), lowering rainwater pH below 5.6.",
    expTamil: "சல்பர் டை ஆக்சைடு (SO2) மற்றும் நைட்ரஜன் ஆக்சைடுகள் (NOx)."
  },
  {
    ch: 8, qNum: 5,
    qText: "The phenomenon where toxic non-biodegradable chemicals (like DDT) increase in concentration at successive trophic levels is:",
    qTamil: "உணவுச் சங்கிலியில் நச்சுப் பொருட்களின் செறிவு படிப்படியாக அதிகரிக்கும் நிகழ்வு:",
    optA: "Biomagnification", optB: "Eutrophication", optC: "Biodegradation", optD: "Biofortification",
    ans: "A",
    exp: "Biological magnification occurs because persistent fat-soluble compounds cannot be excreted and concentrate up the food web.",
    expTamil: "உயிரி பெருக்கம் (Biomagnification) எனப்படும்."
  },
  {
    ch: 8, qNum: 6,
    qText: "Chipko Movement, aimed at protecting trees and preventing deforestation by hugging trees, originated in 1973 in:",
    qTamil: "சிப்கோ இயக்கம் 1973-ல் எங்கு தொடங்கியது?",
    optA: "Chamoli district, Uttarakhand (Garhwal Himalayas)", optB: "Tamil Nadu", optC: "Kerala", optD: "Rajasthan",
    ans: "A",
    exp: "Sunderlal Bahuguna and Chandi Prasad Bhatt led villagers in Chamoli to protect forest trees from commercial loggers.",
    expTamil: "உத்தரகாண்ட் மாநிலத்தின் சாமோலி மாவட்டத்தில் தொடங்கியது."
  },
  {
    ch: 8, qNum: 7,
    qText: "Which international treaty adopted in 1987 controls the production and consumption of ozone-depleting substances?",
    qTamil: "ஓசோன் சிதைக்கும் பொருட்களைக் கட்டுப்படுத்த 1987-ல் கையெழுத்தான சர்வதேச ஒப்பந்தம் எது?",
    optA: "Montreal Protocol", optB: "Kyoto Protocol", optC: "Paris Agreement", optD: "Ramsar Convention",
    ans: "A",
    exp: "The Montreal Protocol on Substances that Deplete the Ozone Layer was finalized in 1987 and entered into force in 1989.",
    expTamil: "மான்ட்ரியல் நெறிமுறை (Montreal Protocol) ஆகும்."
  },
  {
    ch: 8, qNum: 8,
    qText: "Excessive nutrient enrichment (phosphates and nitrates) leading to algal blooms and oxygen depletion in water bodies is:",
    qTamil: "நீர்நிலைகளில் ஊட்டச்சத்துக்கள் மிகுந்து பாசி படர்ந்து ஆக்சிஜன் குறையும் நிகழ்வு:",
    optA: "Eutrophication", optB: "Biomagnification", optC: "Stratification", optD: "Salinization",
    ans: "A",
    exp: "Eutrophication triggers dense phytoplankton blooms whose subsequent microbial decay strips oxygen from the aquatic column.",
    expTamil: "யூட்ரோஃபிகேஷன் (Eutrophication) எனப்படும்."
  },
  {
    ch: 8, qNum: 9,
    qText: "Lichens are widely recognized as sensitive biological bioindicators for monitoring air pollution of:",
    qTamil: "லைக்கன்கள் எந்த வாயுவின் காற்று மாசுபாட்டைக் காட்டும் உயிரி குறிகாட்டிகள்?",
    optA: "Sulfur dioxide (SO2)", optB: "Carbon monoxide", optC: "Hydrogen", optD: "Methane",
    ans: "A",
    exp: "Lichens absorb nutrients directly from air and cannot tolerate sulfur dioxide (SO2), vanishing from heavily polluted urban areas.",
    expTamil: "சல்பர் டை ஆக்சைடு (SO2) மாசுபாட்டைக் காட்டும் உயிரி குறிகாட்டி."
  },
  {
    ch: 8, qNum: 10,
    qText: "The Kyoto Protocol (1997) is an international agreement committed to reducing emissions of:",
    qTamil: "கியோட்டோ நெறிமுறை (1997) எதனை குறைக்க உறுதியளிக்கிறது?",
    optA: "Greenhouse gases", optB: "Heavy metals", optC: "Nuclear waste", optD: "Pesticides",
    ans: "A",
    exp: "The Kyoto Protocol linked to the UNFCCC commits state parties to internationally binding greenhouse gas emission reduction targets.",
    expTamil: "பசுமை இல்ல வாயுக்களைக் குறைக்கும் சர்வதேச ஒப்பந்தம் ஆகும்."
  },

  // CHAPTER 9: Plant Breeding
  {
    ch: 9, qNum: 1,
    qText: "The superior performance and vigor of an F1 hybrid over both of its inbred parents is known as:",
    qTamil: "பெற்றோர்களை விட F1 கலப்பின சந்ததியின் மேம்பட்ட வீரியம் எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Heterosis (Hybrid vigor)", optB: "Inbreeding depression", optC: "Epistasis", optD: "Mutation",
    ans: "A",
    exp: "Heterosis, coined by G.H. Shull in 1914, describes the phenotypic superiority of hybrids over inbred lines.",
    expTamil: "கலப்பின வீரியம் (Heterosis / Hybrid vigor) எனப்படும்."
  },
  {
    ch: 9, qNum: 2,
    qText: "The Russian geneticist and botanist who identified the Eight Global Centers of Origin of cultivated crop plants is:",
    qTamil: "பயிர்களின் பிறப்பிட மையங்களை (Centers of Origin) அடையாளம் கண்ட ரஷ்ய அறிஞர் யார்?",
    optA: "Nikolai I. Vavilov", optB: "Norman Borlaug", optC: "M.S. Swaminathan", optD: "T.S. Venkatraman",
    ans: "A",
    exp: "Nikolai Vavilov formulated the theory of Centers of Origin based on worldwide botanical diversity surveys.",
    expTamil: "நிகோலாய் வாவிலோவ் (N.I. Vavilov) எட்டு பிறப்பிட மையங்களை அடையாளம் கண்டார்."
  },
  {
    ch: 9, qNum: 3,
    qText: "Who is celebrated globally as the 'Father of the Green Revolution'?",
    qTamil: "'பசுமைப் புரட்சியின் தந்தை' என்று உலகளவில் போற்றப்படுபவர் யார்?",
    optA: "Norman E. Borlaug", optB: "M.S. Swaminathan", optC: "B.P. Pal", optD: "Verghese Kurien",
    ans: "A",
    exp: "Dr. Norman Borlaug developed semi-dwarf high-yielding wheat varieties in Mexico and received the Nobel Peace Prize in 1970.",
    expTamil: "நார்மன் போர்லாக் (Norman Borlaug) உலக பசுமைப் புரட்சியின் தந்தை ஆவார்."
  },
  {
    ch: 9, qNum: 4,
    qText: "Who is acclaimed as the 'Father of the Green Revolution in India'?",
    qTamil: "'இந்திய பசுமைப் புரட்சியின் தந்தை' என்று அழைக்கப்படுபவர் யார்?",
    optA: "Dr. M.S. Swaminathan", optB: "Dr. Verghese Kurien", optC: "Dr. Birbal Sahni", optD: "K.C. Mehta",
    ans: "A",
    exp: "Dr. M.S. Swaminathan spearheaded the introduction and breeding of semi-dwarf wheat and rice varieties in India.",
    expTamil: "டாக்டர் எம்.எஸ். சுவாமிநாதன் (Dr. M.S. Swaminathan) இந்திய பசுமைப் புரட்சியின் தந்தை ஆவார்."
  },
  {
    ch: 9, qNum: 5,
    qText: "Triticale, the first human-made man-made cereal crop, is an allopolyploid hybrid between:",
    qTamil: "மனிதனால் உருவாக்கப்பட்ட முதல் தானியமான டிரிட்டிகேல் (Triticale) எவற்றின் கலப்பினமாகும்?",
    optA: "Wheat (Triticum) and Rye (Secale)", optB: "Wheat and Barley", optC: "Rice and Maize", optD: "Oat and Rye",
    ans: "A",
    exp: "Triticale was developed by crossing durum or common wheat with rye (Secale cereale).",
    expTamil: "கோதுமை (Triticum) மற்றும் ரை (Secale) ஆகியவற்றின் கலப்பினமாகும்."
  },
  {
    ch: 9, qNum: 6,
    qText: "The process of removing anthers from bisexual flowers before anthesis to prevent self-pollination in hybridization is:",
    qTamil: "கலப்பின உருவாக்கத்தில் தன் மகரந்தச்சேர்க்கையைத் தடுக்க மகரந்தப்பையை நீக்கும் செயல்முறை:",
    optA: "Emasculation", optB: "Bagging", optC: "Tagging", optD: "Vernalization",
    ans: "A",
    exp: "Emasculation ensures that the flower can be pollinated only with selected pollen from the chosen male parent.",
    expTamil: "ஆண் மலடாக்கம் (Emasculation) எனப்படும்."
  },
  {
    ch: 9, qNum: 7,
    qText: "Breeding crops with higher levels of vitamins, minerals, and proteins to overcome malnutrition is termed:",
    qTamil: "ஊட்டச்சத்து குறைபாட்டை போக்க அதிக வைட்டமின்கள் மற்றும் தாதுக்களுடன் பயிர்களை உருவாக்கும் முறை:",
    optA: "Biofortification", optB: "Biomagnification", optC: "Bioremediation", optD: "Biopiracy",
    ans: "A",
    exp: "Biofortification enhances the micronutrient density of staple food crops through plant breeding and modern biotechnology.",
    expTamil: "உயிரூட்டமேற்றம் (Biofortification) எனப்படும்."
  },
  {
    ch: 9, qNum: 8,
    qText: "Golden Rice is a genetically modified biofortified crop developed to biosynthesize:",
    qTamil: "தங்க அரிசி (Golden Rice) எதனை உற்பத்தி செய்ய மரபணு மாற்றம் செய்யப்பட்டது?",
    optA: "Beta-carotene (provitamin A)", optB: "Vitamin C", optC: "Vitamin D", optD: "Lysine",
    ans: "A",
    exp: "Golden rice expresses phytoene synthase and carotene desaturase genes to produce beta-carotene in rice endosperm.",
    expTamil: "பீட்டா-கரோட்டின் (வைட்டமின் A முன்னோடி) உற்பத்தி செய்ய உருவாக்கப்பட்டது."
  },
  {
    ch: 9, qNum: 9,
    qText: "Gamma garden at Tamil Nadu Agricultural University (TNAU) Coimbatore is used primarily for:",
    qTamil: "கோயம்புத்தூர் TNAU-ல் உள்ள காமா தோட்டம் எதற்கு முதன்மையாகப் பயன்படுகிறது?",
    optA: "Induced Mutation Breeding using Cobalt-60 gamma rays",
    optB: "Tissue culture",
    optC: "Hydroponics",
    optD: "Organic farming",
    ans: "A",
    exp: "Gamma irradiation fields induce novel beneficial genetic mutations in crop varieties like groundnut, pulses, and paddy.",
    expTamil: "சடுதிமாற்ற பயிர்ப் பெருக்கம் (Mutation Breeding) செய்ய பயன்படுகிறது."
  },
  {
    ch: 9, qNum: 10,
    qText: "Sharbati Sonora and Pusa Lerma are famous Indian mutant varieties of:",
    qTamil: "சர்பதி சொனோரா மற்றும் பூசா லெர்மா எந்த பயிரின் சடுதிமாற்ற ரகங்கள்?",
    optA: "Wheat", optB: "Rice", optC: "Maize", optD: "Mustard",
    ans: "A",
    exp: "Sharbati Sonora and Pusa Lerma are amber-grained gamma-ray induced mutant varieties of semi-dwarf wheat.",
    expTamil: "கோதுமை (Wheat) பயிரின் சடுதிமாற்ற ரகங்கள் ஆகும்."
  },

  // CHAPTER 10: Economically Useful Plants & Entrepreneurial Botany
  {
    ch: 10, qNum: 1,
    qText: "Cereals are edible grains that belong to which botanical family?",
    qTamil: "தானியங்கள் எந்த தாவரக் குடும்பத்தைச் சேர்ந்தவை?",
    optA: "Poaceae (Gramineae)", optB: "Fabaceae", optC: "Solanaceae", optD: "Liliaceae",
    ans: "A",
    exp: "True cereals (rice, wheat, maize, barley, millets) belong to the monocot grass family Poaceae.",
    expTamil: "போவேசி / புல் குடும்பத்தைச் (Poaceae) சேர்ந்தவை."
  },
  {
    ch: 10, qNum: 2,
    qText: "The botanical name of 'King of Spices' (Black Pepper) is:",
    qTamil: "'நறுமணப் பொருட்களின் அரசன்' (கருப்பு மிளகு) தாவரவியல் பெயர் என்ன?",
    optA: "Piper nigrum", optB: "Elettaria cardamomum", optC: "Zingiber officinale", optD: "Curcuma longa",
    ans: "A",
    exp: "Piper nigrum (Black pepper) is renowned as the King of Spices, indigenous to the Western Ghats of India.",
    expTamil: "பைப்பர் நைக்ரம் (Piper nigrum) நறுமணப் பொருட்களின் அரசன் எனப்படுகிறது."
  },
  {
    ch: 10, qNum: 3,
    qText: "'Queen of Spices' is the popular title attributed to which spice crop?",
    qTamil: "'நறுமணப் பொருட்களின் அரசி' என்று அழைக்கப்படும் பயிர் எது?",
    optA: "Cardamom (Elettaria cardamomum)", optB: "Clove", optC: "Nutmeg", optD: "Cinnamon",
    ans: "A",
    exp: "Cardamom (Elettaria cardamomum) is crowned the Queen of Spices due to its rich, pleasant aroma and culinary prestige.",
    expTamil: "ஏலக்காய் (Elettaria cardamomum) நறுமணப் பொருட்களின் அரசி எனப்படும்."
  },
  {
    ch: 10, qNum: 4,
    qText: "The potent antimalarial drug Quinine is obtained from the dried bark of:",
    qTamil: "மலேரியா எதிர்ப்பு மருந்தான குயினைன் எந்த தாவரத்தின் பட்டையிலிருந்து பெறப்படுகிறது?",
    optA: "Cinchona officinalis", optB: "Azadirachta indica", optC: "Catharanthus roseus", optD: "Rauwolfia serpentina",
    ans: "A",
    exp: "Quinine is an alkaloid extracted from the bark of Cinchona trees, used for centuries to treat Plasmodium malaria.",
    expTamil: "சின்கோனா (Cinchona officinalis) மரத்தின் பட்டையிலிருந்து பெறப்படுகிறது."
  },
  {
    ch: 10, qNum: 5,
    qText: "Anti-cancer chemotherapy drugs Vinblastine and Vincristine are extracted from:",
    qTamil: "புற்றுநோய் எதிர்ப்பு மருந்துகளான வின்பிளாஸ்டின் மற்றும் வின்கிறிஸ்டின் எதிலிருந்து பிரித்தெடுக்கப்படுகின்றன?",
    optA: "Catharanthus roseus (Periwinkle / Nithyakalyani)", optB: "Ocimum sanctum", optC: "Withania somnifera", optD: "Phyllanthus amarus",
    ans: "A",
    exp: "Catharanthus roseus (Madagascar periwinkle) synthesizes bisindole alkaloids used to treat leukemia and lymphoma.",
    expTamil: "நித்யகல்யாணி / கேத்தரான்தஸ் ரோசியஸ் (Catharanthus roseus) தாவரத்திலிருந்து பெறப்படுகிறது."
  },
  {
    ch: 10, qNum: 6,
    qText: "The traditional Tamil medicinal plant Keezhanelli (Phyllanthus amarus) is widely used for treating:",
    qTamil: "பாரம்பரிய மருத்துவ தாவரமான கீழாநெல்லி (Phyllanthus amarus) எதற்கு சிகிச்சையளிக்கப் பயன்படுகிறது?",
    optA: "Jaundice and viral hepatitis", optB: "Fractures", optC: "Cataract", optD: "Asthma",
    ans: "A",
    exp: "Phyllanthus amarus contains phyllanthin and hypophyllanthin, which confer potent hepatoprotective activity against hepatitis B.",
    expTamil: "மஞ்சள் காமாலை மற்றும் கல்லீரல் பாதிப்புகளுக்கு சிகிச்சையளிக்கப் பயன்படுகிறது."
  },
  {
    ch: 10, qNum: 7,
    qText: "Which oilseed plant is widely cultivated as an eco-friendly source for Biodiesel production?",
    qTamil: "பயோடீசல் உற்பத்திக்கு ஏற்ற சூழல் நட்பு எண்ணெய் வித்து தாவரம் எது?",
    optA: "Jatropha curcas (Kattamanakku)", optB: "Helianthus annuus", optC: "Brassica campestris", optD: "Sesamum indicum",
    ans: "A",
    exp: "Jatropha curcas seeds yield non-edible triglyceride oils that undergo transesterification to produce biodiesel.",
    expTamil: "காட்டாமணக்கு (Jatropha curcas) பயோடீசல் தயாரிக்கப் பயன்படுகிறது."
  },
  {
    ch: 10, qNum: 8,
    qText: "The edible oyster mushroom commonly cultivated in agricultural entrepreneurship is:",
    qTamil: "பொதுவாக வளர்க்கப்படும் சிப்பி காளான் எது?",
    optA: "Pleurotus ostreatus / Pleurotus florida", optB: "Agaricus bisporus", optC: "Volvariella volvacea", optD: "Amanita phalloides",
    ans: "A",
    exp: "Pleurotus species (Oyster mushroom) are easily grown on pasteurized paddy straw substrates under tropical conditions.",
    expTamil: "புளூரோட்டஸ் (Pleurotus) சிப்பி காளான் ஆகும்."
  },
  {
    ch: 10, qNum: 9,
    qText: "Spirulina is cultivated commercially on a large scale primarily as a source of:",
    qTamil: "ஸ்பைருலினா எதற்காக பெரிய அளவில் வணிக ரீதியாக வளர்க்கப்படுகிறது?",
    optA: "Single Cell Protein (SCP) rich in amino acids and vitamins", optB: "Biofuel", optC: "Wood timber", optD: "Fibre",
    ans: "A",
    exp: "Spirulina (Arthrospira platensis) is a cyanobacterium containing 60-70% protein by dry weight, sold as SCP superfood.",
    expTamil: "புரதச்சத்து நிறைந்த ஒற்றை செல் புரதம் (Single Cell Protein) ஆகும்."
  },
  {
    ch: 10, qNum: 10,
    qText: "The natural sweetener Stevia ('Sweet herb of Paraguay') is derived from:",
    qTamil: "இயற்கை இனிப்பானான ஸ்டீவியா எந்த தாவரத்திலிருந்து பெறப்படுகிறது?",
    optA: "Stevia rebaudiana", optB: "Saccharum officinarum", optC: "Beta vulgaris", optD: "Glycyrrhiza glabra",
    ans: "A",
    exp: "Stevia rebaudiana leaves accumulate zero-calorie diterpene stevioside glycosides that are 300 times sweeter than sucrose.",
    expTamil: "ஸ்டீவியா ரெபாடியானா (Stevia rebaudiana) தாவரத்தின் இலைகளிலிருந்து பெறப்படுகிறது."
  }
];

const code = `import type { Question } from "@/types";

export const BOTANY_QUESTIONS: Question[] = [
${botQuestions.map(q => `  {
    id: "q-bot-${q.ch * 100 + q.qNum}",
    chapterId: "bot-ch-${q.ch}",
    subjectId: "sub-botany",
    stream: "Biology",
    sourceType: "Book-In",
    status: "Teacher Review",
    difficulty: "${q.qNum % 3 === 0 ? "Hard" : q.qNum % 2 === 0 ? "Medium" : "Easy"}",
    sourceTextbookId: "12-bio-botany-english-f15d4524",
    sourcePage: ${15 + q.ch * 18},
    sourceQuestionNumber: ${q.qNum},
    sourcePresentation: "Text",
    questionText: ${JSON.stringify(q.qText)},
    questionTextTamil: ${JSON.stringify(q.qTamil || "")},
    optionA: ${JSON.stringify(q.optA)},
    optionB: ${JSON.stringify(q.optB)},
    optionC: ${JSON.stringify(q.optC)},
    optionD: ${JSON.stringify(q.optD)},
    correctAnswer: "${q.ans}",
    explanation: ${JSON.stringify(q.exp)},
    explanationTamil: ${JSON.stringify(q.expTamil || "")},
    createdAt: "2026-10-10T12:00:00Z"
  }`).join(",\n")}
];
`;

writeFileSync("src/lib/data/questions/botany.ts", code);
console.log(`Generated complete Botany dataset with ${botQuestions.length} questions across 10 chapters.`);
