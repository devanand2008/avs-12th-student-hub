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

const zooQuestions: RawQ[] = [
  // CHAPTER 1: Reproduction in Organisms
  {
    ch: 1, qNum: 1,
    qText: "In which type of parthenogenesis are only males produced?",
    qTamil: "எந்த வகை கன்னி இனப்பெருக்கத்தில் ஆண் உயிரிகள் மட்டுமே உருவாகின்றன?",
    optA: "Arrhenotoky", optB: "Thelytoky", optC: "Amphitoky", optD: "Both a and b",
    ans: "A",
    exp: "In arrhenotoky (e.g., honeybees, wasps), unfertilized eggs develop only into haploid males.",
    expTamil: "அர்ரினோடோக்கி (Arrhenotoky) முறையில் ஆண் உயிரிகள் மட்டுமே உருவாகின்றன."
  },
  {
    ch: 1, qNum: 2,
    qText: "In which mode of reproduction genetic variations are prominently observed in offspring?",
    qTamil: "எந்த வகை இனப்பெருக்கத்தில் சந்ததிகளில் மரபியல் வேறுபாடுகள் காணப்படுகின்றன?",
    optA: "Sexual reproduction", optB: "Asexual reproduction", optC: "Parthenogenesis", optD: "Budding",
    ans: "A",
    exp: "Sexual reproduction involves meiosis and crossing over, producing novel genetic recombinations and variations.",
    expTamil: "பாலினப் பெருக்கம் (Sexual reproduction) மரபியல் மாறுபாடுகளை உருவாக்குகிறது."
  },
  {
    ch: 1, qNum: 3,
    qText: "The mode of asexual reproduction where multiple fissions occur inside a resistant cyst in Amoeba is:",
    qTamil: "அமீபாவில் தடித்த உறைக்குள் பல பிளவு மூலம் நடைபெறும் பாலிலா இனப்பெருக்கம்:",
    optA: "Encystment and Sporulation", optB: "Budding", optC: "Regeneration", optD: "Strobilation",
    ans: "A",
    exp: "Under adverse conditions, Amoeba secretes a 3-layered chitinous cyst (encystment) and divides by sporulation.",
    expTamil: "உறையாதல் மற்றும் வித்து உருவாக்கம் (Sporulation)."
  },
  {
    ch: 1, qNum: 4,
    qText: "Conjugation as a form of primitive sexual exchange of genetic material is observed in:",
    qTamil: "இணைவு முறை (Conjugation) இனப்பெருக்கம் எதில் காணப்படுகிறது?",
    optA: "Paramecium and Bacteria", optB: "Hydra", optC: "Sponges", optD: "Planaria",
    ans: "A",
    exp: "Conjugation involves temporary union and mutual exchange of micronuclear genetic material in ciliates like Paramecium.",
    expTamil: "பாராமிசியம் மற்றும் பாக்டீரியாவில் இணைவு முறை காணப்படுகிறது."
  },
  {
    ch: 1, qNum: 5,
    qText: "Internal asexual buds produced in freshwater sponges (Spongilla) for survival are termed:",
    qTamil: "நன்னீர் கடற்பஞ்சுகளில் உருவாகும் உள் மொட்டுகள் எவ்வாறு அழைக்கப்படுகின்றன?",
    optA: "Gemmules", optB: "Conidia", optC: "Zoospores", optD: "Planulae",
    ans: "A",
    exp: "Gemmules are internal buds containing archaeocytes enclosed in a protective spicule-reinforced coat.",
    expTamil: "ஜெம்முல்கள் (Gemmules) எனப்படும்."
  },
  {
    ch: 1, qNum: 6,
    qText: "Regeneration of an entire animal from a small fragment of body is remarkably demonstrated in:",
    qTamil: "உடலின் சிறிய துண்டிலிருந்து முழு உடலும் மீண்டும் உருவாகும் மறுஉருவாக்கம் எதில் சிறப்பானது?",
    optA: "Planaria (Dugesia)", optB: "Ascaris", optC: "Fasciola", optD: "Taenia",
    ans: "A",
    exp: "Planaria has abundant stem cells (neoblasts) allowing morphallaxis and epimorphosis from minuscule cut fragments.",
    expTamil: "பிளனேரியாவில் (Planaria) முழு மறுஉருவாக்கம் காணப்படுகிறது."
  },
  {
    ch: 1, qNum: 7,
    qText: "Organisms that reproduce only once in their entire lifetime and then die are termed:",
    qTamil: "வாழ்நாளில் ஒரே ஒரு முறை மட்டும் இனப்பெருக்கம் செய்து இறக்கும் உயிரிகள்:",
    optA: "Semelparous", optB: "Iteroparous", optC: "Viviparous", optD: "Oviparous",
    ans: "A",
    exp: "Semelparity describes a single reproductive episode before death (e.g., Pacific salmon, bamboo).",
    expTamil: "செமல்பேரஸ் (Semelparous) உயிரிகள் எனப்படும்."
  },
  {
    ch: 1, qNum: 8,
    qText: "Animals in which embryos develop within eggs retained inside the mother's body without placental connection are:",
    qTamil: "தாயின் உடலுக்குள் முட்டை பொரிந்து குட்டியை ஈனும் உயிரினங்கள்:",
    optA: "Ovoviviparous (e.g., Shark)", optB: "Viviparous", optC: "Oviparous", optD: "Parthenogenetic",
    ans: "A",
    exp: "In ovoviviparity, the mother retains eggs until hatching, nourished by yolk rather than a maternal placenta.",
    expTamil: "முட்டையிட்டுக் குட்டி ஈனுபவை (Ovoviviparous)."
  },
  {
    ch: 1, qNum: 9,
    qText: "Thelytoky is a form of parthenogenesis where unfertilized eggs develop only into:",
    qTamil: "தெலிடோக்கி கன்னி இனப்பெருக்கத்தில் எவை மட்டுமே உருவாகின்றன?",
    optA: "Females only", optB: "Males only", optC: "Both males and females", optD: "Hermaphrodites",
    ans: "A",
    exp: "In thelytoky (e.g., Lacerta saxicola lizards, aphids), unfertilized eggs produce strictly female progeny.",
    expTamil: "பெண் உயிரிகள் மட்டுமே (Females only) உருவாகின்றன."
  },
  {
    ch: 1, qNum: 10,
    qText: "External fertilization is characteristic of which group of vertebrates?",
    qTamil: "வெளிக்கருவுறுதல் எந்த முதுகுநாணிகளின் சிறப்பியல்பு?",
    optA: "Bony fishes and Amphibians", optB: "Reptiles", optC: "Birds", optD: "Mammals",
    ans: "A",
    exp: "Most fishes and amphibians release gametes simultaneously into water for external fertilization.",
    expTamil: "மீன்கள் மற்றும் தவளைகளில் (Bony fishes and Amphibians) வெளிக்கருவுறுதல் நடைபெறுகிறது."
  },

  // CHAPTER 2: Human Reproduction
  {
    ch: 2, qNum: 1,
    qText: "Mature spermatozoa are stored and attain functional motility and fertilizing ability in the:",
    qTamil: "முதிர்ந்த விந்தணுக்கள் சேமிக்கப்பட்டு இயக்கம் மற்றும் கருவுறுதல் திறனைப் பெறும் இடம் எது?",
    optA: "Epididymis", optB: "Seminiferous tubules", optC: "Vas deferens", optD: "Seminal vesicle",
    ans: "A",
    exp: "Spermatozoa undergo maturation and are stored temporarily in the coiled epididymis duct.",
    expTamil: "எபிடிடிமிஸ் (Epididymis) பகுதியில் சேமிக்கப்பட்டு முதிர்ச்சியடைகின்றன."
  },
  {
    ch: 2, qNum: 2,
    qText: "The primary male sex hormone Testosterone is synthesized and secreted by:",
    qTamil: "ஆண் பாலின ஹார்மோனான டெஸ்டோஸ்டிரோனை சுரக்கும் செல்கள் எவை?",
    optA: "Leydig cells (Interstitial cells)", optB: "Sertoli cells", optC: "Epididymis", optD: "Prostate gland",
    ans: "A",
    exp: "Leydig cells in the interstitial tissue between seminiferous tubules secrete androgens under LH stimulation.",
    expTamil: "லேடிக் செல்கள் (Leydig cells) டெஸ்டோஸ்டிரோனை சுரக்கின்றன."
  },
  {
    ch: 2, qNum: 3,
    qText: "Which male accessory reproductive gland produces the largest proportion (approx 60-70%) of seminal fluid?",
    qTamil: "விந்து திரவத்தின் பெரும்பகுதியை (60-70%) சுரக்கும் துணைச் சுரப்பி எது?",
    optA: "Seminal vesicles", optB: "Bulbourethral gland (Cowper's)", optC: "Prostate gland", optD: "Mucous gland",
    ans: "A",
    exp: "Seminal vesicles secrete alkaline fructose-rich fluid comprising ~60-70% of total ejaculate volume.",
    expTamil: "விந்துப் பைகள் (Seminal vesicles) 60-70% திரவத்தை சுரக்கின்றன."
  },
  {
    ch: 2, qNum: 4,
    qText: "The male erectile homologue of the female clitoris is the:",
    qTamil: "பெண் உறுப்பான கிளிட்டோரிஸுக்கு இணையான ஆண் உறுப்பு எது?",
    optA: "Penis", optB: "Scrotum", optC: "Urethra", optD: "Testis",
    ans: "A",
    exp: "Embryologically, the penis and clitoris develop from the same bipotential genital tubercle.",
    expTamil: "ஆண்குறி (Penis) கிளிட்டோரிஸுக்கு இணையான உறுப்பாகும்."
  },
  {
    ch: 2, qNum: 5,
    qText: "The physiological site of human fertilization in the female reproductive tract is the:",
    qTamil: "மனிதரில் கருவுறுதல் பொதுவாக எங்கு நடைபெறுகிறது?",
    optA: "Ampullary region of the Fallopian tube", optB: "Uterine fundus", optC: "Cervix", optD: "Ovary",
    ans: "A",
    exp: "Fertilization takes place at the junction of the ampulla and isthmus in the oviduct / Fallopian tube.",
    expTamil: "ஃபேலோப்பியன் குழாயின் ஆம்புல்லா பகுதி (Ampullary region)."
  },
  {
    ch: 2, qNum: 6,
    qText: "Ovulation in the human menstrual cycle is triggered by a sudden mid-cycle surge of:",
    qTamil: "அண்டவெளியீடு (Ovulation) எந்த ஹார்மோனின் திடீர் எழுச்சியால் தூண்டப்படுகிறது?",
    optA: "Luteinizing Hormone (LH)", optB: "FSH", optC: "Progesterone", optD: "Oxytocin",
    ans: "A",
    exp: "A rapid peak in LH secretion around day 14 (LH surge) causes rupture of the Graafian follicle and ovum release.",
    expTamil: "லூட்டினைசிங் ஹார்மோன் (LH எழுச்சி) அண்டவெளியீட்டை தூண்டுகிறது."
  },
  {
    ch: 2, qNum: 7,
    qText: "Following ovulation, the collapsed Graafian follicle transforms into a temporary endocrine gland called:",
    qTamil: "அண்டவெளியீட்டிற்குப் பின் கிராஃபியன் பாலிக்கிள் எந்த தற்காலிக நாளமில்லா சுரப்பியாக மாறுகிறது?",
    optA: "Corpus luteum", optB: "Corpus albicans", optC: "Corpus callosum", optD: "Corona radiata",
    ans: "A",
    exp: "The ruptured follicle luteinizes into the Corpus Luteum, secreting high levels of progesterone.",
    expTamil: "கார்பஸ் லூட்டியம் (Corpus luteum) புரோஜெஸ்டிரோனை சுரக்கிறது."
  },
  {
    ch: 2, qNum: 8,
    qText: "The enzyme-filled cap covering the anterior portion of the sperm nucleus is the:",
    qTamil: "விந்தணுவின் தலைப்பகுதியை மூடியுள்ள நொதிகள் நிறைந்த அமைப்பு:",
    optA: "Acrosome", optB: "Axoneme", optC: "Centrosome", optD: "Mitochondrial spiral",
    ans: "A",
    exp: "The acrosome derived from the Golgi apparatus contains hyaluronidase and acrosin to penetrate egg layers.",
    expTamil: "அக்ரோசோம் (Acrosome) அண்ட உறைகளை துளைக்க உதவுகிறது."
  },
  {
    ch: 2, qNum: 9,
    qText: "The primary hormone responsible for stimulating milk ejection / let-down during lactation is:",
    qTamil: "பால் வெளியேற்றத்தை (Milk ejection) தூண்டும் ஹார்மோன் எது?",
    optA: "Oxytocin", optB: "Prolactin", optC: "Estrogen", optD: "Progesterone",
    ans: "A",
    exp: "Oxytocin contracts myoepithelial cells surrounding alveoli to eject milk. Prolactin synthesizes milk.",
    expTamil: "ஆக்சிடோசின் (Oxytocin) பால் வெளியேற்றத்தைத் தூண்டுகிறது."
  },
  {
    ch: 2, qNum: 10,
    qText: "The initial yellow-tinted milk secreted in the first few days post-partum, rich in antibodies (IgA), is:",
    qTamil: "பிரசவத்திற்கு பின் முதல் சில நாட்களில் சுரக்கும் IgA ஆன்டிபாடிகள் நிறைந்த சீம்பால்:",
    optA: "Colostrum", optB: "Casein", optC: "Lactalbumin", optD: "Chyme",
    ans: "A",
    exp: "Colostrum supplies vital passive immunity and nutrients to protect the neonate against infections.",
    expTamil: "சீம்பால் (Colostrum) குழந்தைக்கு நோய் எதிர்ப்புத் திறனைத் தருகிறது."
  },

  // CHAPTER 3: Reproductive Health
  {
    ch: 3, qNum: 1,
    qText: "Which of the following is correct regarding HIV, hepatitis B, gonorrhoea and trichomoniasis?",
    qTamil: "HIV, ஹெபடைடிஸ் B, கொனோரியா மற்றும் டிரைகோமோனியாசிஸ் பற்றிய சரியான கூற்று எது?",
    optA: "HIV is a pathogen whereas others are diseases", optB: "Gonorrhoea is a viral STD", optC: "Hepatitis B is eradicated", optD: "All are non-communicable",
    ans: "A",
    exp: "HIV is the viral human immunodeficiency pathogen that causes AIDS, whereas the other three names refer directly to diseases.",
    expTamil: "HIV என்பது நோய்க்கிருமி, மற்றவை நோய்களின் பெயர்கள் ஆகும்."
  },
  {
    ch: 3, qNum: 2,
    qText: "Which of the following groups includes sexually transmitted infections caused by bacteria only?",
    qTamil: "பாக்டீரியாவால் மட்டுமே உண்டாகும் பால்வினை நோய்களின் குழு எது?",
    optA: "Syphilis, gonorrhoea, and chlamydiasis", optB: "AIDS, herpes, and warts", optC: "Trichomoniasis and candidiasis", optD: "Hepatitis B and syphilis",
    ans: "A",
    exp: "Syphilis (Treponema), Gonorrhoea (Neisseria), and Chlamydiasis (Chlamydia) are strictly bacterial STIs.",
    expTamil: "சிபிலிஸ், கொனோரியா மற்றும் கிளமிடியாசிஸ் பாக்டீரியாவால் ஏற்படுகின்றன."
  },
  {
    ch: 3, qNum: 3,
    qText: "Surgical sterilization method performed in males by cutting and ligating the vas deferens is:",
    qTamil: "ஆண்களில் விந்து நாளத்தை துண்டித்து கட்டும் நிரந்தர குடும்பக் கட்டுப்பாடு முறை:",
    optA: "Vasectomy", optB: "Tubectomy", optC: "Castration", optD: "Hysterectomy",
    ans: "A",
    exp: "Vasectomy occludes the vasa deferentia, preventing sperm transport during ejaculation.",
    expTamil: "வாசக்டமி (Vasectomy) ஆண்களுக்கான நிரந்தர கருத்தடை முறையாகும்."
  },
  {
    ch: 3, qNum: 4,
    qText: "Surgical contraception in females where the Fallopian tubes are blocked or severed is termed:",
    qTamil: "பெண்களில் ஃபேலோப்பியன் குழாயை துண்டித்து கட்டும் அறுவை சிகிச்சை முறை:",
    optA: "Tubectomy", optB: "Vasectomy", optC: "Oophorectomy", optD: "Mastectomy",
    ans: "A",
    exp: "Tubectomy blocks the Fallopian tubes, preventing ova from encountering spermatozoa.",
    expTamil: "டியூபக்டமி (Tubectomy) பெண்களுக்கான கருத்தடை முறை ஆகும்."
  },
  {
    ch: 3, qNum: 5,
    qText: "'Saheli' is a novel non-steroidal oral contraceptive pill developed in India by scientists at:",
    qTamil: "'சஹேலி' என்ற ஸ்டீராய்டு அல்லாத கருத்தடை மாத்திரையை உருவாக்கிய ஆய்வு நிறுவனம் எது?",
    optA: "CDRI Lucknow (Central Drug Research Institute)", optB: "ICMR Delhi", optC: "CCMB Hyderabad", optD: "AIIMS",
    ans: "A",
    exp: "Saheli (centchroman / ormeloxifene) was developed by CDRI Lucknow as a 'once-a-week' oral contraceptive.",
    expTamil: "CDRI லக்னோ (மத்திய மருந்து ஆராய்ச்சி நிறுவனம்) உருவாக்கியது."
  },
  {
    ch: 3, qNum: 6,
    qText: "Amniocentesis is a prenatal diagnostic test performed on amniotic fluid primarily used to detect:",
    qTamil: "அம்னியோசென்டசிஸ் பனிக்குடத் துளைப்பு பரிசோதனை முதன்மையாக எதனைக் கண்டறிய பயன்படுகிறது?",
    optA: "Chromosomal / genetic abnormalities in the fetus (e.g., Down syndrome)", optB: "Blood group of father", optC: "Maternal diabetes", optD: "Child IQ",
    ans: "A",
    exp: "Amniocentesis karyotypes fetal cells to detect genetic or chromosomal defects, though misused for illegal sex determination.",
    expTamil: "கருவின் குரோமோசோம் மற்றும் மரபியல் குறைபாடுகளை கண்டறிய பயன்படுகிறது."
  },
  {
    ch: 3, qNum: 7,
    qText: "Assisted Reproductive Technology (ART) procedure where embryo up to 8 blastomeres is transferred into the Fallopian tube is:",
    qTamil: "8 பிளாஸ்டோமியர் வரையிலான கருவை ஃபேலோப்பியன் குழாயில் செலுத்தும் ART முறை எது?",
    optA: "ZIFT (Zygote Intra-Fallopian Transfer)", optB: "IUT (Intra-Uterine Transfer)", optC: "GIFT", optD: "ICSI",
    ans: "A",
    exp: "In ZIFT, in vitro fertilized zygotes up to the 8-cell stage are transferred directly into the Fallopian tube.",
    expTamil: "ZIFT (Zygote Intra-Fallopian Transfer) எனப்படும்."
  },
  {
    ch: 3, qNum: 8,
    qText: "The technique where a single sperm is directly injected into the cytoplasm of an ovum in vitro is called:",
    qTamil: "விந்தணுவை நேரடியாக அண்ட செல்லுக்குள் செலுத்தும் முறை எது?",
    optA: "ICSI (Intra-Cytoplasmic Sperm Injection)", optB: "IUI", optC: "GIFT", optD: "ZIFT",
    ans: "A",
    exp: "ICSI directly microinjects a single spermatozoon into the oocyte cytoplasm to achieve fertilization.",
    expTamil: "ICSI (Intra-Cytoplasmic Sperm Injection) எனப்படும்."
  },
  {
    ch: 3, qNum: 9,
    qText: "World Population Day is observed annually across the globe on:",
    qTamil: "உலக மக்கள் தொகை தினம் ஆண்டுதோறும் எந்த நாளில் அனுசரிக்கப்படுகிறது?",
    optA: "July 11", optB: "December 1", optC: "June 5", optD: "April 7",
    ans: "A",
    exp: "United Nations declared July 11 as World Population Day to focus attention on urgency of population issues.",
    expTamil: "ஜூலை 11 உலக மக்கள் தொகை தினமாக அனுசரிக்கப்படுகிறது."
  },
  {
    ch: 3, qNum: 10,
    qText: "Which of the following is a copper-releasing Intra-Uterine Device (IUD)?",
    qTamil: "தாமிரத்தை வெளியிடும் உள் கருப்பை சாதனம் (IUD) எது?",
    optA: "CuT / Cu7 / Multiload 375", optB: "Lippes loop", optC: "Progestasert", optD: "LNG-20",
    ans: "A",
    exp: "Copper-releasing IUDs suppress sperm motility and fertilizing capacity via release of Cu2+ ions.",
    expTamil: "CuT / Cu7 / Multiload 375 தாமிரத்தை வெளியிடும் சாதனங்கள் ஆகும்."
  },

  // CHAPTER 4: Principles of Inheritance and Variation
  {
    ch: 4, qNum: 1,
    qText: "Haemophilia is more common in human males because it is inherited as an:",
    qTamil: "ஹீமோபிலியா ஆண்களில் அதிகம் காணப்பட காரணம் அது எந்த மரபணு பண்பு?",
    optA: "X-linked recessive trait", optB: "Y-linked dominant trait", optC: "Autosomal dominant trait", optD: "X-linked dominant trait",
    ans: "A",
    exp: "Males are hemizygous (XY) and express X-linked recessive mutations directly with a single mutant allele.",
    expTamil: "X-குரோமோசோம் ஒடுங்கு மரபணு (X-linked recessive) பண்பாகும்."
  },
  {
    ch: 4, qNum: 2,
    qText: "ABO blood group system in humans is a textbook classic example of:",
    qTamil: "மனிதனின் ABO இரத்த வகை முறை எதற்கு சிறந்த எடுத்துக்காட்டு?",
    optA: "Multiple alleles and Co-dominance", optB: "Incomplete dominance", optC: "Pleiotropy", optD: "Sex-linked genes",
    ans: "A",
    exp: "Three alleles (IA, IB, Io) govern ABO blood type, with IA and IB exhibiting co-dominance over Io.",
    expTamil: "பல்கூட்டு அல்லீல்கள் மற்றும் இணை ஓங்குதன்மை (Multiple alleles)."
  },
  {
    ch: 4, qNum: 3,
    qText: "Three children of a family have blood groups A, AB, and B. What are the genotypes of their parents?",
    qTamil: "ஒரு குடும்பத்தின் குழந்தைகளுக்கு A, AB, B இரத்த வகைகள் உள்ளன எனில் பெற்றோரின் மரபணு வகை என்ன?",
    optA: "IAIo and IBIo", optB: "IAIA and IBIB", optC: "IAIB and IoIo", optD: "IAIo and IoIo",
    ans: "A",
    exp: "Crossing heterozygous A (IAIo) with heterozygous B (IBIo) yields IAIB (AB), IAIo (A), IBIo (B), and IoIo (O).",
    expTamil: "IAIo மற்றும் IBIo பெற்றோர்கள்."
  },
  {
    ch: 4, qNum: 4,
    qText: "The genetic disorder caused by Trisomy of chromosome 21 is known as:",
    qTamil: "21-வது குரோமோசோம் டிரைசோமியால் ஏற்படும் மரபணு குறைபாடு எது?",
    optA: "Down syndrome", optB: "Klinefelter syndrome", optC: "Turner syndrome", optD: "Patau syndrome",
    ans: "A",
    exp: "Down syndrome (47, XX/XY, +21) was described by Langdon Down in 1866 as trisomy of autosome 21.",
    expTamil: "டவுன் சிண்ட்ரோம் (Down syndrome) எனப்படும்."
  },
  {
    ch: 4, qNum: 5,
    qText: "Klinefelter syndrome in human males is characterized by the karyotype:",
    qTamil: "கிளைன்பெல்டர் சிண்ட்ரோம் கொண்ட ஆண்களின் குரோமோசோம் அமைப்பு என்ன?",
    optA: "47, XXY", optB: "45, XO", optC: "47, XYY", optD: "47, XXX",
    ans: "A",
    exp: "Nondisjunction leads to an extra X chromosome in males (47, XXY) causing gynaecomastia and sterility.",
    expTamil: "47, XXY என்பது கிளைன்பெல்டர் சிண்ட்ரோம் குரோமோசோம் அமைப்பாகும்."
  },
  {
    ch: 4, qNum: 6,
    qText: "Turner syndrome in females is caused by the monosomy karyotype:",
    qTamil: "டர்னர் சிண்ட்ரோம் கொண்ட பெண்களின் குரோமோசோம் அமைப்பு என்ன?",
    optA: "45, XO", optB: "47, XXY", optC: "47, XXX", optD: "46, XY",
    ans: "A",
    exp: "Turner syndrome results from the absence of one sex chromosome (45, XO), causing rudimentary ovaries and short stature.",
    expTamil: "45, XO என்பது டர்னர் சிண்ட்ரோம் அமைப்பு ஆகும்."
  },
  {
    ch: 4, qNum: 7,
    qText: "Sickle-cell anaemia is caused by substitution of which amino acid in the beta-globin chain?",
    qTamil: "அரிவாள் செல் இரத்த சோகையில் பீட்டா-குளோபின் சங்கிலியில் எந்த அமினோ அமிலம் மாறுகிறது?",
    optA: "Glutamic acid replaced by Valine at 6th position", optB: "Valine replaced by Glycine", optC: "Alanine replaced by Proline", optD: "Lysine replaced by Leucine",
    ans: "A",
    exp: "A point mutation (GAG -> GUG) replaces hydrophilic glutamic acid with hydrophobic valine at codon 6 of beta-globin.",
    expTamil: "6-வது இடத்தில் குளுடாமிக் அமிலம் வாலினால் மாற்றப்படுகிறது."
  },
  {
    ch: 4, qNum: 8,
    qText: "The Lyon hypothesis explains dosage compensation in female mammals via random inactivation of one X chromosome to form a:",
    qTamil: "பெண் பாலூட்டிகளில் ஒரு X-குரோமோசோம் சுருங்கி செயலிழந்து உருவாகும் அமைப்பு:",
    optA: "Barr body", optB: "Centrosome", optC: "Nucleolus", optD: "Kinetochore",
    ans: "A",
    exp: "Heterochromatic condensed inactive X chromosomes appear as dark Barr bodies at the inner nuclear membrane.",
    expTamil: "பார் உறுப்பு (Barr body) எனப்படும்."
  },
  {
    ch: 4, qNum: 9,
    qText: "Thalassemia is an autosomal recessive blood disorder characterized by impaired synthesis of:",
    qTamil: "தலசீமியா எதன் உற்பத்தி குறைபாட்டால் ஏற்படும் இரத்தக் குறைபாடு?",
    optA: "Globin polypeptide chains of hemoglobin", optB: "Platelets", optC: "Albumin", optD: "Fibrinogen",
    ans: "A",
    exp: "Mutations in alpha-globin (Chr 16) or beta-globin (Chr 11) genes reduce functional hemoglobin synthesis.",
    expTamil: "ஹீமோகுளோபினின் குளோபின் சங்கிலி உற்பத்தி குறைபாடு."
  },
  {
    ch: 4, qNum: 10,
    qText: "Red-green color blindness is an X-linked recessive disorder where affected individuals cannot distinguish between:",
    qTamil: "சிவப்பு-பச்சை நிறக்குருடு உடையவர்களால் எந்த நிறங்களை வேறுபடுத்தி அறிய முடியாது?",
    optA: "Red and green colors", optB: "Blue and yellow", optC: "Black and white", optD: "Orange and violet",
    ans: "A",
    exp: "Defective photopigment genes on the X chromosome impair retinal cone function for red and green wavelengths.",
    expTamil: "சிவப்பு மற்றும் பச்சை நிறங்களை வேறுபடுத்த முடியாது."
  },

  // CHAPTER 5: Molecular Genetics
  {
    ch: 5, qNum: 1,
    qText: "Hershey and Chase experiment with bacteriophage T2 (1952) conclusively proved that:",
    qTamil: "ஹெர்ஷி மற்றும் சேஸ் ஆய்வு எதனை திட்டவட்டமாக நிரூபித்தது?",
    optA: "DNA is the universal genetic material", optB: "Protein enters the bacteria", optC: "Viruses are cells", optD: "RNA is the only genome",
    ans: "A",
    exp: "32P-labeled DNA entered bacterial host cells while 35S-labeled protein coats remained outside.",
    expTamil: "டிஎன்ஏ (DNA) மரபணு பொருள் என்பதை திட்டவட்டமாக நிரூபித்தது."
  },
  {
    ch: 5, qNum: 2,
    qText: "DNA and RNA are macromolecules consisting of repeating monomer units known as:",
    qTamil: "டிஎன்ஏ மற்றும் ஆர்என்ஏ எவற்றின் பாலிமர்கள் ஆகும்?",
    optA: "Nucleotides", optB: "Amino acids", optC: "Fatty acids", optD: "Polysaccharides",
    ans: "A",
    exp: "Nucleic acids are polymers of nucleotides composed of a pentose sugar, a nitrogenous base, and phosphate groups.",
    expTamil: "நியூக்ளியோடைடுகள் (Nucleotides) ஆகும்."
  },
  {
    ch: 5, qNum: 3,
    qText: "The semi-conservative mode of DNA replication was experimentally demonstrated in E. coli by:",
    qTamil: "டிஎன்ஏ-வின் பாதி பழமை பேணும் இரட்டித்தல் முறையை நிரூபித்தவர்கள் யார்?",
    optA: "Meselson and Stahl (1958)", optB: "Watson and Crick", optC: "Griffith", optD: "Kornberg",
    ans: "A",
    exp: "Matthew Meselson and Franklin Stahl used 15N heavy isotope density gradient centrifugation.",
    expTamil: "மெசல்சன் மற்றும் ஸ்டால் (Meselson and Stahl) நிரூபித்தனர்."
  },
  {
    ch: 5, qNum: 4,
    qText: "During DNA replication, the discontinuous lagging strand is synthesized as short fragments called:",
    qTamil: "டிஎன்ஏ இரட்டித்தலின் போது பின்தங்கும் இழையில் உருவாகும் சிறிய துண்டுகள் எவை?",
    optA: "Okazaki fragments", optB: "Kornberg fragments", optC: "Introns", optD: "Exons",
    ans: "A",
    exp: "Reiji and Tsuneko Okazaki identified 1000-2000 nucleotide fragments synthesized in the 5' -> 3' direction on the lagging strand.",
    expTamil: "ஒகசாகி துண்டுகள் (Okazaki fragments) எனப்படும்."
  },
  {
    ch: 5, qNum: 5,
    qText: "The standard initiation codon that signals the start of translation and codes for Methionine is:",
    qTamil: "மொழிபெயர்ப்பை தொடங்கும் தொடக்கக் குறியீடு (Initiation codon) எது?",
    optA: "AUG", optB: "UAA", optC: "UAG", optD: "UGA",
    ans: "A",
    exp: "AUG functions as the universal start codon in mRNA, specifying methionine.",
    expTamil: "AUG என்பது தொடக்கக் குறியீடு ஆகும்."
  },
  {
    ch: 5, qNum: 6,
    qText: "Which of the following triplet codons function as stop/termination codons during translation?",
    qTamil: "மொழிபெயர்ப்பை முடிவுக்கு கொண்டுவரும் நிறுத்தக் குறியீடுகள் எவை?",
    optA: "UAA, UAG, and UGA", optB: "AUG, GUG, and UGG", optC: "AAA, UUU, and CCC", optD: "CGA, CGU, and CGC",
    ans: "A",
    exp: "UAA (ochre), UAG (amber), and UGA (opal) lack cognate aminoacyl-tRNAs and terminate protein synthesis.",
    expTamil: "UAA, UAG, மற்றும் UGA நிறுத்தக் குறியீடுகள் ஆகும்."
  },
  {
    ch: 5, qNum: 7,
    qText: "The Lac Operon model of transcriptional gene regulation in E. coli was proposed in 1961 by:",
    qTamil: "லாக் ஓபரான் (Lac Operon) மாதிரியை 1961-ல் முன்மொழிந்தவர்கள் யார்?",
    optA: "Francois Jacob and Jacques Monod", optB: "Watson and Crick", optC: "Avery and MacLeod", optD: "Nirenberg and Khorana",
    ans: "A",
    exp: "Jacob and Monod decoded the operon mechanism consisting of regulator, promoter, operator, and structural genes (lacZ, Y, A).",
    expTamil: "ஜேக்கப் மற்றும் மோனாட் (Jacob and Monod) முன்மொழிந்தனர்."
  },
  {
    ch: 5, qNum: 8,
    qText: "In the Lac Operon, the lacZ structural gene encodes which hydrolytic enzyme?",
    qTamil: "லாக் ஓபரானில் lacZ மரபணு எந்த நொதியை குறியீடாக்குகிறது?",
    optA: "Beta-galactosidase", optB: "Permease", optC: "Transacetylase", optD: "Ligase",
    ans: "A",
    exp: "Beta-galactosidase hydrolyzes lactose into glucose and galactose.",
    expTamil: "பீட்டா-கேலக்டோசிடேஸ் (Beta-galactosidase) நொதி ஆகும்."
  },
  {
    ch: 5, qNum: 9,
    qText: "The Human Genome Project (HGP) determined that the human genome contains approximately how many base pairs?",
    qTamil: "மனித மரபணு திட்டம் (HGP) மனித மரபணுவில் எத்தனை கார இணைகள் இருப்பதாக கண்டறிந்தது?",
    optA: "3.16 billion base pairs (3.2 x 10^9 bp)", optB: "1 billion bp", optC: "10 billion bp", optD: "500 million bp",
    ans: "A",
    exp: "The finished haploid human sequence contains ~3.164 billion nucleotide base pairs.",
    expTamil: "சுமார் 3.16 பில்லியன் கார இணைகள் (base pairs)."
  },
  {
    ch: 5, qNum: 10,
    qText: "DNA fingerprinting (DNA profiling) technology was invented in 1984 by British geneticist:",
    qTamil: "டிஎன்ஏ கைரேகை தொழில்நுட்பத்தை 1984-ல் கண்டுபிடித்தவர் யார்?",
    optA: "Sir Alec Jeffreys", optB: "Lalji Singh", optC: "Kary Mullis", optD: "Frederick Sanger",
    ans: "A",
    exp: "Alec Jeffreys discovered Variable Number of Tandem Repeats (VNTRs) for individual genetic profiling.",
    expTamil: "சர் அலெக் ஜெஃப்ரிஸ் (Sir Alec Jeffreys) கண்டுபிடித்தார்."
  },

  // CHAPTER 6: Evolution
  {
    ch: 6, qNum: 1,
    qText: "The first primitive forms of life on planet Earth originated in:",
    qTamil: "பூமியில் முதல் உயிரினம் எங்கு தோன்றியது?",
    optA: "Water (oceans / primordial soup)", optB: "On land", optC: "In air", optD: "On mountain peaks",
    ans: "A",
    exp: "Life originated in oceanic waters approx 3.8 billion years ago as chemosynthetic anaerobic prokaryotes.",
    expTamil: "நீரில் (Water) தோன்றியது."
  },
  {
    ch: 6, qNum: 2,
    qText: "Who published the monumental classic 'Origin of Species by Means of Natural Selection' in 1859?",
    qTamil: "1859-ல் 'சிற்றினங்களின் தோற்றம்' என்ற புகழ்பெற்ற நூலை வெளியிட்டவர் யார்?",
    optA: "Charles Darwin", optB: "Jean-Baptiste Lamarck", optC: "August Weismann", optD: "Hugo de Vries",
    ans: "A",
    exp: "Charles Darwin published his theory of natural selection based on his voyage aboard HMS Beagle.",
    expTamil: "சார்லஸ் டார்வின் (Charles Darwin) வெளியிட்டார்."
  },
  {
    ch: 6, qNum: 3,
    qText: "The Mutation Theory of organic evolution was proposed in 1901 by:",
    qTamil: "சடுதிமாற்றக் கோட்பாட்டை 1901-ல் வெளியிட்டவர் யார்?",
    optA: "Hugo de Vries", optB: "Charles Darwin", optC: "Lamarck", optD: "Malthus",
    ans: "A",
    exp: "Hugo de Vries studied Oenothera lamarckiana (evening primrose) and proposed mutations as the raw material for evolution.",
    expTamil: "ஹியூகோ டி விரிஸ் (Hugo de Vries) முன்மொழிந்தார்."
  },
  {
    ch: 6, qNum: 4,
    qText: "The wings of birds and the wings of butterflies serve the same flight function but have different embryonic origins, showing:",
    qTamil: "பறவையின் இறக்கைகளும் பட்டாம்பூச்சியின் இறக்கைகளும் எதற்கு எடுத்துக்காட்டு?",
    optA: "Analogous organs (Convergent evolution)", optB: "Homologous organs", optC: "Vestigial organs", optD: "Atavism",
    ans: "A",
    exp: "Analogous organs have different evolutionary origins but convergent functions.",
    expTamil: "செயலொத்த உறுப்புகள் (குவி பரிணாமம் - Convergent evolution)."
  },
  {
    ch: 6, qNum: 5,
    qText: "Forelimbs of human, cheetah, whale, and bat possess similar skeletal pentadactyl architecture, representing:",
    qTamil: "மனிதன், சிறுத்தை, திமிங்கலம், வௌவால் ஆகியவற்றின் முன்னங்கால்கள் எதற்கு எடுத்துக்காட்டு?",
    optA: "Homologous organs (Divergent evolution)", optB: "Analogous organs", optC: "Vestigial organs", optD: "Atavism",
    ans: "A",
    exp: "Homologous structures share a common ancestral anatomical plan adapted for different functions.",
    expTamil: "அமைப்பொத்த உறுப்புகள் (விரி பரிணாமம் - Divergent evolution)."
  },
  {
    ch: 6, qNum: 6,
    qText: "The Hardy-Weinberg algebraic equation for calculating allele and genotypic frequencies in an ideal population is:",
    qTamil: "ஹார்டி-வெயின்பெர்க் சமன்பாடு எது?",
    optA: "p^2 + 2pq + q^2 = 1", optB: "p + q = 2", optC: "p^2 - q^2 = 1", optD: "2p + 2q = 1",
    ans: "A",
    exp: "Where p = frequency of dominant allele, q = frequency of recessive allele, and 2pq = heterozygous genotype.",
    expTamil: "p^2 + 2pq + q^2 = 1 சமன்பாடு ஆகும்."
  },
  {
    ch: 6, qNum: 7,
    qText: "Industrial melanism in the Peppered Moth (Biston betularia) in England is a classic historical demonstration of:",
    qTamil: "தொழில்சாலை மெலனின் நிறமியாக்கம் எதற்கு சிறந்த சான்றாகும்?",
    optA: "Natural Selection", optB: "Genetic drift", optC: "Mutation", optD: "Artificial selection",
    ans: "A",
    exp: "Soot-darkened trees favored survival of melanic carbonaria moths over light typica moths due to differential bird predation.",
    expTamil: "இயற்கைத் தேர்வு (Natural Selection) கோட்பாட்டிற்கு சான்றாகும்."
  },
  {
    ch: 6, qNum: 8,
    qText: "The evolutionary theory of inheritance of acquired characters was advanced by:",
    qTamil: "அடைந்த பண்புகள் மரபுவழி கடத்தப்படும் என்ற கோட்பாட்டை கூறியவர் யார்?",
    optA: "Jean-Baptiste Lamarck", optB: "Darwin", optC: "Wallace", optD: "Mendel",
    ans: "A",
    exp: "Lamarck published Philosophie Zoologique (1809) proposing the use and disuse of organs.",
    expTamil: "ஜீன் பாப்டிஸ்ட் லாமார்க் (Lamarck) ஆவார்."
  },
  {
    ch: 6, qNum: 9,
    qText: "The famous spark discharge experiment that synthesized organic amino acids from inorganic gases (CH4, NH3, H2, H2O) was done by:",
    qTamil: "அமினோ அமிலங்களை செயற்கையாக உருவாக்கிய மின்னிறக்க ஆய்வை மேற்கொண்டவர்கள் யார்?",
    optA: "Stanley Miller and Harold Urey (1953)", optB: "Oparin and Haldane", optC: "Louis Pasteur", optD: "Spallanzani",
    ans: "A",
    exp: "Miller-Urey experiment demonstrated abiotic synthesis of glycine, alanine, and aspartic acid in prebiotic conditions.",
    expTamil: "ஸ்டான்லி மில்லர் மற்றும் ஹெரால்ட் யூரே (Miller and Urey)."
  },
  {
    ch: 6, qNum: 10,
    qText: "Connecting link between reptiles and birds that possessed teeth and feathered wings was:",
    qTamil: "ஊர்வன மற்றும் பறவைகளுக்கு இடைப்பட்ட இணைப்பு உயிரியாக விளங்கியது எது?",
    optA: "Archaeopteryx lithographica", optB: "Ichthyostega", optC: "Seymouria", optD: "Dimetrodon",
    ans: "A",
    exp: "Archaeopteryx possessed avian feathers and wings combined with reptilian teeth, tail vertebrae, and clawed digits.",
    expTamil: "ஆர்க்கியாப்டெரிக்ஸ் (Archaeopteryx lithographica) ஆகும்."
  },

  // CHAPTER 7: Human Health and Diseases
  {
    ch: 7, qNum: 1,
    qText: "A patient experiencing acute bloody diarrhea and abdominal cramps is likely infected by which enteric bacterium?",
    qTamil: "இரத்தக் கழிச்சல் (Dysentery) நோயை ஏற்படுத்தும் பாக்டீரியா எது?",
    optA: "Shigella dysenteriae", optB: "Streptococcus pyogenes", optC: "Clostridium tetani", optD: "Corynebacterium diphtheriae",
    ans: "A",
    exp: "Shigella dysenteriae causes bacillary dysentery marked by blood and mucus in stools.",
    expTamil: "ஷிஜெல்லா டிசென்டீரியா (Shigella dysenteriae) ஆகும்."
  },
  {
    ch: 7, qNum: 2,
    qText: "The exo-erythrocytic schizogony cycle of the malarial parasite Plasmodium takes place in the human:",
    qTamil: "மலேரியா ஒட்டுண்ணியான பிளாஸ்மோடியத்தின் கல்லீரல் சைசோகோனி சுழற்சி எங்கு நடைபெறுகிறது?",
    optA: "Liver hepatocytes", optB: "Red blood cells (RBC)", optC: "Spleen", optD: "Stomach",
    ans: "A",
    exp: "Injected sporozoites first enter liver parenchymal cells to multiply as hepatic schizonts before invading erythrocytes.",
    expTamil: "கல்லீரல் செல்களில் (Liver hepatocytes) நடைபெறுகிறது."
  },
  {
    ch: 7, qNum: 3,
    qText: "The infectious stage of Plasmodium that is inoculated into the human bloodstream by the bite of female Anopheles mosquito is:",
    qTamil: "பெண் அனாபிலஸ் கொசு மனிதனுக்குள் செலுத்தும் பிளாஸ்மோடியத்தின் தொற்று நிலை எது?",
    optA: "Sporozoite", optB: "Trophozoite", optC: "Schizont", optD: "Merozoite",
    ans: "A",
    exp: "Sickle-shaped sporozoites stored in mosquito salivary glands enter human capillary blood during blood meals.",
    expTamil: "ஸ்போரோசோயிட்டு (Sporozoite) தொற்று நிலையாகும்."
  },
  {
    ch: 7, qNum: 4,
    qText: "Which immunoglobulin antibody class is most abundant in human serum and crosses the maternal placenta to protect the fetus?",
    qTamil: "தாயின் நச்சுக்கொடியைத் தாண்டி கருவை பாதுகாக்கும் ஆன்டிபாடி எது?",
    optA: "IgG", optB: "IgM", optC: "IgA", optD: "IgE",
    ans: "A",
    exp: "IgG constitutes ~80% of circulating antibodies and is the only isotype actively transported across the syncytiotrophoblast.",
    expTamil: "IgG ஆன்டிபாடி நச்சுக்கொடியைத் தாண்டி பாதுகாக்கிறது."
  },
  {
    ch: 7, qNum: 5,
    qText: "Which antibody isotype mediates immediate hypersensitivity allergic reactions and binds to tissue mast cells?",
    qTamil: "ஒவ்வாமை மற்றும் ஒவ்வாமை எதிர்வினைகளில் ஈடுபடும் ஆன்டிபாடி எது?",
    optA: "IgE", optB: "IgD", optC: "IgG", optD: "IgM",
    ans: "A",
    exp: "IgE binds Fc receptors on mast cells and basophils, triggering degranulation and histamine release upon allergen contact.",
    expTamil: "IgE ஆன்டிபாடி ஒவ்வாமை எதிர்வினைகளில் ஈடுபடுகிறது."
  },
  {
    ch: 7, qNum: 6,
    qText: "Widal diagnostic agglutination test is clinically performed to confirm infection of:",
    qTamil: "வைடால் (Widal) பரிசோதனை எதனை கண்டறிய செய்யப்படுகிறது?",
    optA: "Typhoid fever (Salmonella typhi)", optB: "Tuberculosis", optC: "Cholera", optD: "Syphilis",
    ans: "A",
    exp: "Widal test measures serum agglutinating antibodies against O and H somatic antigens of Salmonella enterica serotype Typhi.",
    expTamil: "டைபாய்டு காய்ச்சலை (Typhoid fever) கண்டறிய பயன்படுகிறது."
  },
  {
    ch: 7, qNum: 7,
    qText: "Elephantiasis (Lymphatic Filariasis) characterized by chronic swelling of lower limbs is caused by:",
    qTamil: "யானைக்கால் நோயை உண்டாக்கும் புழு எது?",
    optA: "Wuchereria bancrofti", optB: "Ascaris lumbricoides", optC: "Enterobius vermicularis", optD: "Taenia solium",
    ans: "A",
    exp: "Filarial nematodes (Wuchereria bancrofti / Brugia malayi) obstruct lymphatic vessels of the lower extremities.",
    expTamil: "உச்சரேரியா பான்கிராஃப்டி (Wuchereria bancrofti) யானைக்கால் நோயை உண்டாக்குகிறது."
  },
  {
    ch: 7, qNum: 8,
    qText: "Human Immunodeficiency Virus (HIV) selectively targets and destroys which key cells of the immune system?",
    qTamil: "HIV வைரஸ் நோய் எதிர்ப்பு மண்டலத்தின் எந்த செல்களை தாக்கி அழிக்கிறது?",
    optA: "CD4+ T-helper lymphocytes", optB: "B-lymphocytes", optC: "Neutrophils", optD: "Erythrocytes",
    ans: "A",
    exp: "HIV gp120 binds to surface CD4 receptors on helper T-cells, causing progressive cellular immunodeficiency.",
    expTamil: "CD4+ T-உதவி செல்களை (T-helper cells) அழிக்கிறது."
  },
  {
    ch: 7, qNum: 9,
    qText: "The standard initial serological screening test for HIV infection is:",
    qTamil: "எய்ட்ஸ் நோயைக் கண்டறியும் ஆரம்ப கட்ட பரிசோதனை எது?",
    optA: "ELISA (Enzyme-Linked Immunosorbent Assay)", optB: "Western Blot", optC: "Northern Blot", optD: "PCR",
    ans: "A",
    exp: "ELISA is the initial high-sensitivity screening test, followed by Western blot for confirmatory diagnosis.",
    expTamil: "எலிசா (ELISA) பரிசோதனை ஆகும்."
  },
  {
    ch: 7, qNum: 10,
    qText: "Cancer-causing genes present in viral genomes or transformed cells are known as:",
    qTamil: "புற்றுநோயை உண்டாக்கும் மரபணுக்கள் எவ்வாறு அழைக்கப்படுகின்றன?",
    optA: "Oncogenes", optB: "Cistrons", optC: "Transposons", optD: "Operons",
    ans: "A",
    exp: "Oncogenes are mutated or viral versions of cellular proto-oncogenes that stimulate uncontrolled cell proliferation.",
    expTamil: "ஆன்கோஜீன்கள் (Oncogenes) எனப்படும்."
  },

  // CHAPTER 8: Microbes in Human Welfare
  {
    ch: 8, qNum: 1,
    qText: "Which filamentous fungus is widely employed for industrial fermentation and production of citric acid?",
    qTamil: "சிட்ரிக் அமிலத்தின் தொழில்துறை உற்பத்திக்கு பயன்படும் பூஞ்சை எது?",
    optA: "Aspergillus niger", optB: "Penicillium notatum", optC: "Rhizopus oryzae", optD: "Trichoderma viride",
    ans: "A",
    exp: "Aspergillus niger ferments molasses and sucrose substrates into high concentrations of citric acid.",
    expTamil: "அஸ்பெர்கில்லஸ் நைஜர் (Aspergillus niger) பூஞ்சை."
  },
  {
    ch: 8, qNum: 2,
    qText: "Identify the correctly matched microbe and its primary industrial fermentation product:",
    qTamil: "சரியாகப் பொருந்திய நுண்ணுயிரி மற்றும் அதன் உற்பத்திப் பொருளைக் கண்டறிக:",
    optA: "Saccharomyces cerevisiae - Ethanol", optB: "Acetobacter aceti - Antibiotics", optC: "Penicillium notatum - Acetic acid", optD: "Methanobacterium - Lactic acid",
    ans: "A",
    exp: "Saccharomyces cerevisiae (Brewer's yeast) ferments sugars into ethyl alcohol and carbon dioxide.",
    expTamil: "சாக்கரோமைசஸ் செரிவிசியே - எத்தனால் (Ethanol)."
  },
  {
    ch: 8, qNum: 3,
    qText: "Statins, the blood cholesterol-lowering pharmaceutical agents, are competitively synthesized using:",
    qTamil: "இரத்த கொழுப்பைக் குறைக்கும் ஸ்டேடின்கள் எந்த ஈஸ்ட்டிலிருந்து பெறப்படுகின்றன?",
    optA: "Monascus purpureus (yeast)", optB: "Trichoderma polysporum", optC: "Clostridium butyricum", optD: "Streptococcus",
    ans: "A",
    exp: "Statins produced by the red yeast Monascus purpureus competitively inhibit HMG-CoA reductase.",
    expTamil: "மொனாஸ்கஸ் பர்பூரியஸ் (Monascus purpureus) ஈஸ்ட்."
  },
  {
    ch: 8, qNum: 4,
    qText: "Cyclosporin A, an indispensable immunosuppressive medication used in organ transplantation, is produced by:",
    qTamil: "உறுப்பு மாற்று அறுவை சிகிச்சையில் பயன்படும் சைக்ளோஸ்போரின் A எந்த பூஞ்சையிலிருந்து பெறப்படுகிறது?",
    optA: "Trichoderma polysporum", optB: "Aspergillus niger", optC: "Penicillium chrysogenum", optD: "Saccharomyces",
    ans: "A",
    exp: "Trichoderma polysporum yields Cyclosporin A, which suppresses T-cell mediated graft rejection.",
    expTamil: "டிரைக்கோடெர்மா பாலிஸ்போரம் (Trichoderma polysporum) பூஞ்சை."
  },
  {
    ch: 8, qNum: 5,
    qText: "The 'clot buster' enzyme Streptokinase, used to dissolve intravascular thrombi in heart attack patients, is isolated from:",
    qTamil: "இரத்தக் கட்டிகளைக் கரைக்கும் ஸ்ட்ரெப்டோகைனேஸ் நொதி எதிலிருந்து பெறப்படுகிறது?",
    optA: "Streptococcus bacteria", optB: "Bacillus subtilis", optC: "Clostridium", optD: "Rhizobium",
    ans: "A",
    exp: "Genetically engineered Streptococcus strains produce streptokinase to dissolve coronary thrombosis.",
    expTamil: "ஸ்ட்ரெப்டோகாக்கஸ் (Streptococcus) பாக்டீரியா."
  },
  {
    ch: 8, qNum: 6,
    qText: "In sewage water treatment, secondary treatment is primarily a biological process carried out by:",
    qTamil: "கழிவுநீர் சுத்திகரிப்பில் இரண்டாம் நிலை சுத்திகரிப்பு எதனால் மேற்கொள்ளப்படுகிறது?",
    optA: "Aerobic microbial flocs (bacteria and fungal filaments)", optB: "Chemical precipitation", optC: "Filtration through sand", optD: "Chlorination",
    ans: "A",
    exp: "Aerobic flocs rapidly consume organic pollutants in aeration tanks, drastically reducing Biochemical Oxygen Demand (BOD).",
    expTamil: "காற்றோட்ட நுண்ணுயிரி திரள்கள் (Aerobic flocs) மூலம் BOD குறைக்கப்படுகிறது."
  },
  {
    ch: 8, qNum: 7,
    qText: "Biogas generated in anaerobic digesters (gobar gas) primarily consists of:",
    qTamil: "பயோகேஸ் / சாண எரிவாயுவில் முதன்மையாக உள்ள வாயு எது?",
    optA: "Methane (50-70%) and Carbon dioxide", optB: "Carbon monoxide", optC: "Hydrogen only", optD: "Oxygen",
    ans: "A",
    exp: "Methanogens (Methanobacterium) digest cellulosic cattle dung to yield methane (CH4) and CO2.",
    expTamil: "மீத்தேன் (50-70%) மற்றும் கார்பன் டை ஆக்சைடு."
  },
  {
    ch: 8, qNum: 8,
    qText: "Bacillus thuringiensis (Bt) is commercialized worldwide as an effective biological pest control agent against:",
    qTamil: "பேசில்லஸ் துரிஞ்சியன்சிஸ் (Bt) எந்த பூச்சிகளுக்கு எதிராக உயிரி பூச்சிக்கொல்லியாக பயன்படுகிறது?",
    optA: "Lepidopteran and coleopteran insect larvae (caterpillars, bollworms)", optB: "Fungi", optC: "Bacteria", optD: "Nematodes",
    ans: "A",
    exp: "Bt spores produce endotoxin Cry crystal proteins that form pores in the insect alkaline gut, killing pest larvae.",
    expTamil: "பூச்சி புழுக்கள் மற்றும் கம்பளிப்பூச்சிகளுக்கு எதிராக பயன்படுகிறது."
  },
  {
    ch: 8, qNum: 9,
    qText: "The symbiotic nitrogen-fixing bacterium found in the root nodules of leguminous plants is:",
    qTamil: "பருப்பு வகை தாவரங்களின் வேர் முடிச்சுகளில் வாழும் கூட்டுயிர் நைட்ரஜன் நிலைநிறுத்தும் பாக்டீரியா:",
    optA: "Rhizobium leguminosarum", optB: "Azotobacter", optC: "Clostridium", optD: "Spirillum",
    ans: "A",
    exp: "Rhizobium synthesizes nitrogenase in root nodules under microaerophilic conditions maintained by leghemoglobin.",
    expTamil: "ரைசோபியம் (Rhizobium leguminosarum) ஆகும்."
  },
  {
    ch: 8, qNum: 10,
    qText: "VAM (Vesicular Arbuscular Mycorrhiza) is a fungal symbiotic biofertilizer that enhances plant uptake of:",
    qTamil: "VAM பூஞ்சை வேர் தாவரங்களுக்கு எந்த தாதுவை உறிஞ்ச உதவுகிறது?",
    optA: "Phosphorus", optB: "Iron", optC: "Calcium", optD: "Sodium",
    ans: "A",
    exp: "Endomycorrhizal VAM fungi (Glomus) solubilize and absorb soil phosphorus for host plant roots.",
    expTamil: "பாஸ்பரஸ் (Phosphorus) சத்தை உறிஞ்ச உதவுகிறது."
  },

  // CHAPTER 9: Applications of Biotechnology
  {
    ch: 9, qNum: 1,
    qText: "The first clinical human gene therapy was performed in 1990 on a 4-year-old girl for the treatment of:",
    qTamil: "1990-ல் முதல் மரபணு சிகிச்சை எந்த குறைபாட்டை குணப்படுத்த செய்யப்பட்டது?",
    optA: "Adenosine Deaminase (ADA) deficiency / SCID", optB: "Cystic fibrosis", optC: "Hemophilia", optD: "Cancer",
    ans: "A",
    exp: "French Anderson infused genetically modified retroviral lymphocytes carrying normal ADA cDNA into Ashanti DeSilva.",
    expTamil: "ADA குறைபாடு / SCID சிகிச்சைக்கு செய்யப்பட்டது."
  },
  {
    ch: 9, qNum: 2,
    qText: "Dolly the sheep, the first cloned mammal, was produced in 1996 by Keith Campbell and Ian Wilmut via:",
    qTamil: "டாலி ஆடு எந்த தொழில்நுட்பம் மூலம் உருவாக்கப்பட்டது?",
    optA: "Somatic Cell Nuclear Transfer (SCNT)", optB: "In vitro fertilization", optC: "Parthenogenesis", optD: "Embryo splitting",
    ans: "A",
    exp: "A mammary gland cell nucleus from a Finn Dorset ewe was transferred into an enucleated Scottish Blackface oocyte.",
    expTamil: "உடல செல் உட்கரு மாற்றம் (Somatic Cell Nuclear Transfer)."
  },
  {
    ch: 9, qNum: 3,
    qText: "Genetically engineered human insulin ('Humulin') produced in E. coli was developed and marketed in 1982 by:",
    qTamil: "மரபணு மாற்றப்பட்ட மனித இன்சுலினை (Humulin) 1982-ல் முதன்முதலில் தயாரித்த நிறுவனம் எது?",
    optA: "Eli Lilly and Company", optB: "Pfizer", optC: "Biocon", optD: "Novartis",
    ans: "A",
    exp: "Eli Lilly synthesized two DNA sequences corresponding to insulin A and B chains, uniting them with disulfide bonds.",
    expTamil: "எலி லில்லி (Eli Lilly) நிறுவனம் தயாரித்தது."
  },
  {
    ch: 9, qNum: 4,
    qText: "The first transgenic cow produced in 1997 that secreted human alpha-lactalbumin-enriched milk was named:",
    qTamil: "மனித ஆல்பா-லாக்டல்புமின் புரதம் நிறைந்த பாலை சுரந்த முதல் மரபணு மாற்றப்பட்ட பசு எது?",
    optA: "Rosie", optB: "Dolly", optC: "Polly", optD: "Molly",
    ans: "A",
    exp: "Transgenic cow Rosie produced nutritionally superior humanized milk containing 2.4 grams of human protein per liter.",
    expTamil: "ரோஸி (Rosie) என்ற மரபணு மாற்ற பசு ஆகும்."
  },
  {
    ch: 9, qNum: 5,
    qText: "Alpha-1-antitrypsin produced in milk of transgenic animals is used for the clinical management of:",
    qTamil: "மரபணு மாற்ற விலங்குகளின் பாலிலிருந்து பெறப்படும் ஆல்பா-1-ஆன்டிடிரிப்சின் எந்த நோய்க்கு மருந்தாகிறது?",
    optA: "Emphysema", optB: "Asthma", optC: "Pneumonia", optD: "Tuberculosis",
    ans: "A",
    exp: "Alpha-1-antitrypsin inhibits neutrophil elastase, treating hereditary pulmonary emphysema.",
    expTamil: "எம்பைசீமா (Emphysema) நுரையீரல் நோய்க்கு பயன்படுகிறது."
  },
  {
    ch: 9, qNum: 6,
    qText: "Stem cells that have the developmental potential to differentiate into any cell type of the embryo proper are:",
    qTamil: "கருவின் எந்த வகை செல்லாகவும் வேறுபாடடையும் திறன் கொண்ட ஸ்டெம் செல்கள்:",
    optA: "Pluripotent stem cells", optB: "Unipotent stem cells", optC: "Multipotent stem cells", optD: "Nullipotent",
    ans: "A",
    exp: "Embryonic stem cells from the inner cell mass of the blastocyst are pluripotent.",
    expTamil: "புளூரிபோட்டன்ட் / பல்திறன் ஸ்டெம் செல்கள் (Pluripotent)."
  },
  {
    ch: 9, qNum: 7,
    qText: "Monoclonal antibodies of singular specificity are produced using hybridoma technology developed in 1975 by:",
    qTamil: "ஹைப்ரிடோமா தொழில்நுட்பத்தை 1975-ல் உருவாக்கியவர்கள் யார்?",
    optA: "Georges Kohler and Cesar Milstein", optB: "Paul Berg", optC: "Alexander Fleming", optD: "Edward Jenner",
    ans: "A",
    exp: "Kohler and Milstein fused antigen-primed spleen B-cells with immortal myeloma cells to create hybridomas.",
    expTamil: "கோஹ்லர் மற்றும் மில்ஸ்டீன் (Kohler and Milstein) உருவாக்கினர்."
  },
  {
    ch: 9, qNum: 8,
    qText: "ELISA diagnostic testing is founded on the biological principle of:",
    qTamil: "எலிசா (ELISA) பரிசோதனை எந்த அடிப்படை உயிரியல் கொள்கையின் மேல் இயங்குகிறது?",
    optA: "Antigen - Antibody specific interaction", optB: "DNA hybridization", optC: "Protein denaturation", optD: "Enzyme inhibition",
    ans: "A",
    exp: "ELISA detects presence of pathogens or humoral responses via specific antibody-antigen binding conjugated to enzymes.",
    expTamil: "ஆன்டிஜென் - ஆன்டிபாடி இடையேயான பிணைப்பு கொள்கை."
  },
  {
    ch: 9, qNum: 9,
    qText: "The exploitation of biological resources and traditional indigenous knowledge by multinational corporations without authorization is:",
    qTamil: "பாரம்பரிய அறிவையும் உயிரி வளங்களையும் அனுமதியின்றி சுரண்டுவது எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Biopiracy", optB: "Biopatent", optC: "Bioremediation", optD: "Biofortification",
    ans: "A",
    exp: "Biopiracy refers to the unauthorized appropriation of bioresources and indigenous remedies without fair compensation.",
    expTamil: "உயிரி திருட்டு (Biopiracy) எனப்படும்."
  },
  {
    ch: 9, qNum: 10,
    qText: "Which government committee in India regulates and approves genetically modified organisms (GMOs) and environmental release?",
    qTamil: "இந்தியாவில் மரபணு மாற்ற உயிரினங்களை அனுமதிக்கும் அரசு குழு எது?",
    optA: "GEAC (Genetic Engineering Appraisal Committee)", optB: "ICMR", optC: "CSIR", optD: "DST",
    ans: "A",
    exp: "GEAC under the Ministry of Environment, Forest and Climate Change evaluates safety of transgenic research and release.",
    expTamil: "GEAC (மரபணு பொறியியல் மதிப்பீட்டுக் குழு) ஆகும்."
  },

  // CHAPTER 10: Organisms and Population
  {
    ch: 10, qNum: 1,
    qText: "Organisms that can tolerate and thrive across a wide range of ambient temperatures are called:",
    qTamil: "பரந்த அளவிலான வெப்பநிலையைத் தாங்கி வாழும் உயிரினங்கள்:",
    optA: "Eurytherms", optB: "Stenotherms", optC: "Poikilotherms", optD: "Homeotherms",
    ans: "A",
    exp: "Eurythermal organisms tolerate wide temperature fluctuations, whereas stenothermal organisms are restricted to narrow ranges.",
    expTamil: "யூரிதெர்ம்கள் (Eurytherms) எனப்படும்."
  },
  {
    ch: 10, qNum: 2,
    qText: "The ecological interaction in nature where one species benefits at the fatal expense of another is:",
    qTamil: "இயற்கையில் ஒரு உயிரி பயனடைந்து மற்றொரு உயிரி கொல்லப்படும் தொடர்பு:",
    optA: "Predation (+, -)", optB: "Mutualism (+, +)", optC: "Commensalism (+, 0)", optD: "Amensalism (-, 0)",
    ans: "A",
    exp: "In predation and parasitism, the predator/parasite gains positive fitness (+), harming the prey/host (-).",
    expTamil: "கொன்று உண்ணுதல் (Predation) எனப்படும்."
  },
  {
    ch: 10, qNum: 3,
    qText: "Gause's Competitive Exclusion Principle states that two closely related species competing for the exact same limiting resource:",
    qTamil: "காஸேயின் போட்டி விலக்கல் கோட்பாடு எதனைக் கூறுகிறது?",
    optA: "Cannot coexist indefinitely; the inferior competitor is eliminated", optB: "Will both survive equally", optC: "Will hybridize", optD: "Will mutate",
    ans: "A",
    exp: "G.F. Gause showed that ecological complete competitors cannot coexist in the same niche under constant conditions.",
    expTamil: "ஒரே வளத்திற்காக போட்டியிடும் இரு உயிரினங்கள் தொடர்ந்து ஒன்றாக வாழ முடியாது."
  },
  {
    ch: 10, qNum: 4,
    qText: "The maximum sustainable population size an environment can support indefinitely is known as its:",
    qTamil: "ஒரு குறிப்பிட்ட வாழிடம் தாங்கக்கூடிய அதிகபட்ச மக்கள் தொகை அளவு:",
    optA: "Carrying capacity (K)", optB: "Biotic potential", optC: "Intrinsic rate of increase", optD: "Fecundity",
    ans: "A",
    exp: "Carrying capacity (K) represents the environmental plateau in logistic population growth (Verhulst-Pearl model).",
    expTamil: "சுமக்கும் திறன் (Carrying capacity - K) எனப்படும்."
  },
  {
    ch: 10, qNum: 5,
    qText: "In the logistic population growth equation dN/dt = rN[(K-N)/K], what does 'r' represent?",
    qTamil: "dN/dt = rN[(K-N)/K] சமன்பாட்டில் 'r' என்பது எதனைக் குறிக்கிறது?",
    optA: "Intrinsic rate of natural increase", optB: "Carrying capacity", optC: "Total population size", optD: "Mortality rate",
    ans: "A",
    exp: "'r' is the per capita intrinsic rate of natural increase reflecting biotic potential under unconstrained conditions.",
    expTamil: "இயற்கை அதிகரிப்பின் உள்ளார்ந்த விகிதம் (r) ஆகும்."
  },
  {
    ch: 10, qNum: 6,
    qText: "Winter sleep dormancy exhibited by animals like polar bears during harsh cold seasons is termed:",
    qTamil: "குளிர்காலத்தில் சில விலங்குகள் உறக்க நிலைக்குச் செல்வது எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Hibernation", optB: "Aestivation", optC: "Diapause", optD: "Photoperiodism",
    ans: "A",
    exp: "Hibernation is winter dormancy with lowered metabolic rate. Aestivation is summer dormancy avoiding heat and desiccation.",
    expTamil: "குளிர்கால உறக்கம் (Hibernation) எனப்படும்."
  },
  {
    ch: 10, qNum: 7,
    qText: "Summer sleep dormancy exhibited by lungfishes and snails to escape scorching heat and drought is:",
    qTamil: "கோடைக்கால வெப்பத்திலிருந்து தப்பிக்க விலங்குகள் மேற்கொள்ளும் உறக்கம்:",
    optA: "Aestivation", optB: "Hibernation", optC: "Diapause", optD: "Circadian rhythm",
    ans: "A",
    exp: "Aestivation enables animals to survive arid conditions and water deprivation during peak summer.",
    expTamil: "கோடைகால உறக்கம் (Aestivation) எனப்படும்."
  },
  {
    ch: 10, qNum: 8,
    qText: "The ecological interaction between clownfish and sea anemone where clownfish receives protection from tentacles without hurting anemone is:",
    qTamil: "கோமாளி மீன் மற்றும் கடல் அனிமோன் இடையேயான தொடர்பு:",
    optA: "Commensalism (+, 0)", optB: "Mutualism (+, +)", optC: "Parasitism (+, -)", optD: "Competition (-, -)",
    ans: "A",
    exp: "Clownfish gains protection from stinging nematocysts; anemone is unaffected (+, 0).",
    expTamil: "உடனுண்ணும் வாழ்க்கை (Commensalism) ஆகும்."
  },
  {
    ch: 10, qNum: 9,
    qText: "The intimate symbiotic interaction between fungus and algae or cyanobacteria where both partners depend obligately on each other is:",
    qTamil: "பூஞ்சை மற்றும் பாசிக்கு இடையேயான இருசாரும் பயனடையும் கூட்டுறவு வாழ்க்கை:",
    optA: "Mutualism (+, +)", optB: "Parasitism", optC: "Amensalism", optD: "Predation",
    ans: "A",
    exp: "Lichens exemplify obligate mutualism where photobiont synthesizes sugars and mycobiont provides moisture and minerals.",
    expTamil: "பரஸ்பர உதவி / கூட்டுறவு (Mutualism) எனப்படும்."
  },
  {
    ch: 10, qNum: 10,
    qText: "Allen's Rule in ecological adaptation states that mammals living in colder climates generally have:",
    qTamil: "குளிர்பிரதேச பாலூட்டிகள் பற்றிய ஆலனின் விதி (Allen's Rule) கூறுவது என்ன?",
    optA: "Shorter ears and shorter limbs to minimize heat loss", optB: "Larger ears to dissipate heat", optC: "Thin layer of blubber", optD: "No fur",
    ans: "A",
    exp: "Joel Asaph Allen observed that extremities are reduced in cold environments to minimize surface area to volume ratio.",
    expTamil: "குறைந்த உடல் பரப்பளவில் வெப்ப இழப்பைத் தடுக்க சிறிய காதுகள் மற்றும் சிறிய கால்கள் கொண்டிருக்கும்."
  },

  // CHAPTER 11: Biodiversity and Conservation
  {
    ch: 11, qNum: 1,
    qText: "Which terrestrial biome on Earth harbors the highest species richness and biodiversity?",
    qTamil: "பூமியில் அதிக பல்லுயிர் வளம் கொண்ட நிலப்பரப்பு பயோம் எது?",
    optA: "Tropical rain forests (e.g., Amazon)", optB: "Taiga", optC: "Tundra", optD: "Temperate grasslands",
    ans: "A",
    exp: "Tropical rain forests cover <6% of Earth's land surface but harbor more than 50% of global flora and fauna.",
    expTamil: "வெப்பமண்டல மழைக்காடுகள் (Tropical rain forests) ஆகும்."
  },
  {
    ch: 11, qNum: 2,
    qText: "Conservation of threatened species within their natural wild habitats is known as:",
    qTamil: "அச்சுறுத்தப்பட்ட உயிரினங்களை அவற்றின் இயற்கை வாழிடத்திற்குள்ளேயே பாதுகாப்பது:",
    optA: "In-situ conservation", optB: "Ex-situ conservation", optC: "Cryopreservation", optD: "Captive breeding",
    ans: "A",
    exp: "In-situ conservation preserves endangered species in their native ecosystems (National Parks, Sanctuaries, Biosphere Reserves).",
    expTamil: "உள்வாழிடப் பாதுகாப்பு (In-situ conservation) எனப்படும்."
  },
  {
    ch: 11, qNum: 3,
    qText: "Which of the following is an example of Ex-situ (off-site) biodiversity conservation?",
    qTamil: "வெளிவாழிடப் பாதுகாப்புக்கு (Ex-situ) சிறந்த எடுத்துக்காட்டு எது?",
    optA: "Zoological parks and Botanical gardens", optB: "National parks", optC: "Wildlife sanctuaries", optD: "Biosphere reserves",
    ans: "A",
    exp: "Zoos, botanical gardens, seed banks, and cryobanks conserve threatened organisms outside their native habitats.",
    expTamil: "விலங்கியல் பூங்காக்கள் மற்றும் தாவரவியல் பூங்காக்கள் (Zoological parks)."
  },
  {
    ch: 11, qNum: 4,
    qText: "The concept of 'Biodiversity Hotspots' for prioritizing conservation was formulated in 1988 by:",
    qTamil: "பல்லுயிர் செழுமை மையங்கள் (Biodiversity Hotspots) கோட்பாட்டை உருவாக்கியவர் யார்?",
    optA: "Norman Myers", optB: "Edward O. Wilson", optC: "Robert May", optD: "Paul Ehrlich",
    ans: "A",
    exp: "Norman Myers identified global priority regions with exceptional endemism undergoing severe habitat destruction.",
    expTamil: "நார்மன் மியர்ஸ் (Norman Myers) உருவாக்கினார்."
  },
  {
    ch: 11, qNum: 5,
    qText: "How many Biodiversity Hotspots are officially recognized globally, and how many are in India?",
    qTamil: "உலகளவில் எத்தனை பல்லுயிர் செழுமை மையங்கள் உள்ளன, இந்தியாவில் எத்தனை உள்ளன?",
    optA: "36 in the world, 4 in India", optB: "25 in the world, 2 in India", optC: "50 in the world, 10 in India", optD: "18 in the world, 1 in India",
    ans: "A",
    exp: "There are 36 global hotspots, of which 4 cover parts of India (Western Ghats/Sri Lanka, Indo-Burma, Himalaya, Sundaland).",
    expTamil: "உலகில் 36 மையங்களும், இந்தியாவில் 4 மையங்களும் உள்ளன."
  },
  {
    ch: 11, qNum: 6,
    qText: "The Red Data Book compiling assessments of threatened and endangered species is published by:",
    qTamil: "அழிந்துவரும் உயிரினங்களைப் பட்டியலிடும் 'சிவப்பு தரவு புத்தகம்' (Red Data Book) யாரால் வெளியிடப்படுகிறது?",
    optA: "IUCN (International Union for Conservation of Nature)", optB: "WWF", optC: "UNESCO", optD: "UNEP",
    ans: "A",
    exp: "The IUCN Red List of Threatened Species assesses global conservation status and extinction risks of organisms.",
    expTamil: "IUCN (இயற்கை பாதுகாப்புக்கான சர்வதேச ஒன்றியம்) வெளியிடுகிறது."
  },
  {
    ch: 11, qNum: 7,
    qText: "The first National Park established in India in 1936 was:",
    qTamil: "இந்தியாவில் 1936-ல் நிறுவப்பட்ட முதல் தேசியப் பூங்கா எது?",
    optA: "Jim Corbett National Park (Hailey NP)", optB: "Kaziranga National Park", optC: "Gir National Park", optD: "Sundarbans National Park",
    ans: "A",
    exp: "Jim Corbett National Park in Uttarakhand was established in 1936 to protect the endangered Bengal tiger.",
    expTamil: "ஜிம் கார்பெட் தேசியப் பூங்கா (Jim Corbett National Park) ஆகும்."
  },
  {
    ch: 11, qNum: 8,
    qText: "Project Tiger, the landmark wildlife conservation initiative in India, was launched in:",
    qTamil: "இந்தியாவில் 'புலிகள் பாதுகாப்பு திட்டம்' எந்த ஆண்டு தொடங்கப்பட்டது?",
    optA: "1973", optB: "1980", optC: "1965", optD: "1992",
    ans: "A",
    exp: "Project Tiger was initiated in April 1973 by the Government of India to protect the Bengal tiger from poaching.",
    expTamil: "1973-ல் தொடங்கப்பட்டது."
  },
  {
    ch: 11, qNum: 9,
    qText: "Species confined exclusively to a restricted geographical territory and found nowhere else on Earth are termed:",
    qTamil: "ஒரு குறிப்பிட்ட பகுதியில் மட்டுமே காணப்படும் உள்ளூர் உயிரினங்கள் எவ்வாறு அழைக்கப்படுகின்றன?",
    optA: "Endemic species", optB: "Exotic species", optC: "Keystone species", optD: "Pioneer species",
    ans: "A",
    exp: "Endemism refers to taxa restricted to a specific defined geographical zone (e.g., Nilgiri Tahr in Western Ghats).",
    expTamil: "உள்ளூர் இனங்கள் (Endemic species) எனப்படும்."
  },
  {
    ch: 11, qNum: 10,
    qText: "The Nilgiri Biosphere Reserve, India's first designated biosphere reserve (1986), is located across:",
    qTamil: "இந்தியாவின் முதல் உயிர்க்கோள காப்பகமான நீலகிரி காப்பகம் எங்கு அமைந்துள்ளது?",
    optA: "Tamil Nadu, Kerala, and Karnataka", optB: "Tamil Nadu and Andhra Pradesh", optC: "Maharashtra and Goa", optD: "Kerala only",
    ans: "A",
    exp: "Nilgiri Biosphere Reserve spans 5,520 km² across the trilateral junction of Tamil Nadu, Kerala, and Karnataka in the Western Ghats.",
    expTamil: "தமிழ்நாடு, கேரளா மற்றும் கர்நாடகா சந்திப்பில் அமைந்துள்ளது."
  },

  // CHAPTER 12: Environmental Issues
  {
    ch: 12, qNum: 1,
    qText: "Under the Indian Constitution, the Right to Clean Water is recognized as a fundamental right under:",
    qTamil: "இந்திய அரசியலமைப்பின் கீழ் தூய நீர் உரிமை எந்த பிரிவின் கீழ் அடிப்படை உரிமையாகும்?",
    optA: "Article 21 (Right to Life)", optB: "Article 12", optC: "Article 31", optD: "Article 41",
    ans: "A",
    exp: "The Supreme Court of India interpreted Article 21 (Right to Life and Personal Liberty) to encompass clean water and pollution-free environment.",
    expTamil: "பிரிவு 21 (Article 21 - வாழ்வுரிமை) கீழ் அடிப்படை உரிமையாகும்."
  },
  {
    ch: 12, qNum: 2,
    qText: "The total column thickness of stratospheric ozone layer is measured globally in units of:",
    qTamil: "வளிமண்டல ஓசோன் படலத்தின் தடிமன் எந்த அலகால் அளவிடப்படுகிறது?",
    optA: "Dobson Units (DU)", optB: "Sievert units", optC: "Beaufort Scale", optD: "Decibels",
    ans: "A",
    exp: "One Dobson Unit (DU) represents a layer of pure ozone 0.01 mm thick at standard temperature and pressure (STP).",
    expTamil: "டாப்சன் அலகுகள் (Dobson Units - DU) மூலம் அளவிடப்படுகிறது."
  },
  {
    ch: 12, qNum: 3,
    qText: "The biological cleanup of environmental pollutants such as marine oil spills using microorganisms is:",
    qTamil: "நுண்ணுயிரிகளைப் பயன்படுத்தி கடல் எண்ணெய் கசிவுகளை சுத்தம் செய்யும் முறை:",
    optA: "Bioremediation", optB: "Biomagnification", optC: "Biopiracy", optD: "Bioaccumulation",
    ans: "A",
    exp: "Bioremediation exploits the enzymatic versatility of bacteria (such as Pseudomonas putida 'superbug') to degrade petrochemical hydrocarbons.",
    expTamil: "உயிரி தீர்வு / சீரமைப்பு (Bioremediation) எனப்படும்."
  },
  {
    ch: 12, qNum: 4,
    qText: "Minamata disease in Japan was a tragic neurological syndrome caused by severe poisoning of:",
    qTamil: "ஜப்பானில் மினமாட்டா நோய் எந்த நச்சு உலோகத்தால் ஏற்பட்டது?",
    optA: "Methyl mercury", optB: "Cadmium (Itai-Itai)", optC: "Lead", optD: "Arsenic",
    ans: "A",
    exp: "Bioaccumulation of industrial methylmercury in fish and shellfish consumed by locals caused severe neurotoxicity in Minamata bay.",
    expTamil: "மெத்தில் பாதரசம் (Methyl mercury) நச்சால் ஏற்பட்டது."
  },
  {
    ch: 12, qNum: 5,
    qText: "Itai-Itai disease in Toyama Prefecture, Japan, was caused by chronic ingestion of water contaminated with:",
    qTamil: "இட்டை-இட்டை நோய் எந்த உலோக நச்சுத்தன்மையால் ஏற்பட்டது?",
    optA: "Cadmium (Cd)", optB: "Lead (Pb)", optC: "Mercury (Hg)", optD: "Chromium (Cr)",
    ans: "A",
    exp: "Cadmium poisoning from mining runoff caused osteomalacia and severe joint/spine fractures in affected individuals.",
    expTamil: "காட்மியம் (Cadmium) நச்சுத்தன்மையால் ஏற்பட்டது."
  },
  {
    ch: 12, qNum: 6,
    qText: "Biochemical Oxygen Demand (BOD) is a standard parameter used to assess:",
    qTamil: "உயிரிய ஆக்ஸிஜன் தேவை (BOD) எதனை அளவிட பயன்படுகிறது?",
    optA: "The amount of biodegradable organic pollution in wastewater", optB: "Amount of nitrogen in air", optC: "Water temperature", optD: "Heavy metal toxicity",
    ans: "A",
    exp: "High BOD indicates substantial organic waste requiring excessive dissolved oxygen for aerobic microbial decomposition.",
    expTamil: "கழிவுநீரில் உள்ள கரிம மாசுபாட்டின் அளவை அளவிட பயன்படுகிறது."
  },
  {
    ch: 12, qNum: 7,
    qText: "Noise pollution in environmental regulations is formally quantified in which logarithmic units?",
    qTamil: "ஒலி மாசுபாடு எந்த அலகால் அளவிடப்படுகிறது?",
    optA: "Decibels (dB)", optB: "Hertz", optC: "Watts", optD: "Joules",
    ans: "A",
    exp: "Sound pressure levels are measured in Decibels (dB), with prolonged exposure above 85 dB causing sensorineural hearing damage.",
    expTamil: "டெசிபல் (Decibels - dB) அலகால் அளவிடப்படுகிறது."
  },
  {
    ch: 12, qNum: 8,
    qText: "Electronic waste (E-waste) disposed in municipal landfills poses grave risks due to leaching of toxic:",
    qTamil: "மின் கழிவுகளிலிருந்து (E-waste) கசியும் நச்சு உலோகங்கள் எவை?",
    optA: "Lead, Mercury, and Cadmium", optB: "Calcium and Sodium", optC: "Potassium", optD: "Glucose",
    ans: "A",
    exp: "Printed circuit boards, CRTs, and batteries leach neurotoxic heavy metals like lead (Pb), mercury (Hg), and cadmium (Cd).",
    expTamil: "ஈயம், பாதரசம், மற்றும் காட்மியம் நச்சு உலோகங்கள்."
  },
  {
    ch: 12, qNum: 9,
    qText: "The Central Pollution Control Board (CPCB) of India states that particulate matter of what size causes greatest harm to human lungs?",
    qTamil: "மனித நுரையீரலுக்கு அதிக பாதிப்பை ஏற்படுத்தும் நுண்துகள்களின் அளவு என்ன?",
    optA: "PM 2.5 (diameter 2.5 micrometers or less)", optB: "PM 10", optC: "PM 50", optD: "PM 100",
    ans: "A",
    exp: "Fine particulate matter <= 2.5 µm penetrates past the upper respiratory tract deep into terminal pulmonary alveoli.",
    expTamil: "PM 2.5 (2.5 மைக்ரோமீட்டர் அல்லது அதற்கும் குறைவான துகள்கள்)."
  },
  {
    ch: 12, qNum: 10,
    qText: "The Ramsar Convention (1971) is an international environmental treaty for the conservation and wise use of:",
    qTamil: "ராம்சார் ஒப்பந்தம் (1971) எதனை பாதுகாக்க உருவான சர்வதேச உடன்படிக்கை?",
    optA: "Wetlands", optB: "Deserts", optC: "Coral reefs", optD: "Glaciers",
    ans: "A",
    exp: "Signed in Ramsar, Iran, the convention designates Wetlands of International Importance for biodiversity and migratory waterbirds.",
    expTamil: "ஈரநிலங்களை (Wetlands) பாதுகாக்க உருவானது."
  }
];

const code = `import type { Question } from "@/types";

export const ZOOLOGY_QUESTIONS: Question[] = [
${zooQuestions.map(q => `  {
    id: "q-zoo-${q.ch * 100 + q.qNum}",
    chapterId: "zoo-ch-${q.ch}",
    subjectId: "sub-zoology",
    stream: "Biology",
    sourceType: "Book-In",
    status: "Teacher Review",
    difficulty: "${q.qNum % 3 === 0 ? "Hard" : q.qNum % 2 === 0 ? "Medium" : "Easy"}",
    sourceTextbookId: "12-bio-zoology-english-7e848813",
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

writeFileSync("src/lib/data/questions/zoology.ts", code);
console.log(`Generated complete Zoology dataset with ${zooQuestions.length} questions across 12 chapters.`);
