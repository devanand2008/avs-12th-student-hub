import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("src/lib/data/questions", { recursive: true });

// Unverified drafts requiring source and teacher review for Tamil Nadu Class 12 Computer Science (Chapters 1 to 16)
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

const rawQuestions: RawQ[] = [
  // CHAPTER 1
  {
    ch: 1, qNum: 1,
    qText: "The small sections of code that are used to perform a particular task is called:",
    qTamil: "ஒரு குறிப்பிட்ட செயலை செய்வதற்காகப் பயன்படும் குறிமுறையின் சிறிய பகுதி:",
    optA: "Subroutines", optB: "Files", optC: "Pseudo code", optD: "Modules",
    ans: "A",
    exp: "Subroutines are basic building blocks of computer programs. In programming languages, subroutines are known as Functions.",
    expTamil: "துணை நிரல்கள் (Subroutines) என்பது கணினி நிரல்களின் அடிப்படை கட்டுமானத் தொகுதிகள் ஆகும்."
  },
  {
    ch: 1, qNum: 2,
    qText: "Which of the following is a unit of code that is often defined within a greater code structure?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது பெரும்பாலும் ஒரு பெரிய நிரல் கட்டமைப்பிற்குள் வரையறுக்கப்படும் குறிமுறையின் அலகு?",
    optA: "Subroutines", optB: "Function", optC: "Files", optD: "Modules",
    ans: "B",
    exp: "A function is a unit of code defined within a greater code structure that works on inputs to produce an output.",
    expTamil: "செயற்கூறு (Function) என்பது ஒரு பெரிய குறிமுறைக் கட்டமைப்பில் வரையறுக்கப்படும் அலகு ஆகும்."
  },
  {
    ch: 1, qNum: 3,
    qText: "Which of the following is a distinct syntactic block?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது ஒரு தனித்துவமான தொடரியல் தொகுதி ஆகும்?",
    optA: "Subroutines", optB: "Function", optC: "Definition", optD: "Modules",
    ans: "C",
    exp: "Definitions are distinct syntactic blocks that bind a value or function logic to a name.",
    expTamil: "வரையறைகள் (Definitions) என்பது தனித்துவமான தொடரியல் தொகுதிகள் ஆகும்."
  },
  {
    ch: 1, qNum: 4,
    qText: "The variables in a function definition are called as:",
    qTamil: "செயற்கூறு வரையறையில் உள்ள மாறிகள் எவ்வாறு அழைக்கப்படுகின்றன?",
    optA: "Subroutines", optB: "Function", optC: "Definition", optD: "Parameters",
    ans: "D",
    exp: "Parameters are variables in a function definition that receive values when the function is called.",
    expTamil: "செயற்கூறு வரையறையில் உள்ள மாறிகள் அளபுருக்கள் (Parameters) எனப்படும்."
  },
  {
    ch: 1, qNum: 5,
    qText: "The values which are passed to a function definition are called:",
    qTamil: "செயற்கூறு வரையறைக்கு அனுப்பப்படும் மதிப்புகள் எவ்வாறு அழைக்கப்படுகின்றன?",
    optA: "Arguments", optB: "Subroutines", optC: "Function", optD: "Definition",
    ans: "A",
    exp: "Arguments are the actual values passed to a function call.",
    expTamil: "செயற்கூறு அழைப்பிற்கு அனுப்பப்படும் மதிப்புகள் செயலுருபுகள் (Arguments) எனப்படும்."
  },
  {
    ch: 1, qNum: 6,
    qText: "Which of the following are mandatory to write the type annotations in the function definition?",
    qTamil: "செயற்கூறு வரையறையில் தரவு வகை குறிப்புகளை எழுத எது கட்டாயமானது?",
    optA: "Curly braces", optB: "Parentheses", optC: "Square brackets", optD: "indentations",
    ans: "B",
    exp: "Parentheses are mandatory when writing explicit type annotations in typed functional definitions.",
    expTamil: "வகை குறிப்புகளை எழுதும் போது அடைப்புக்குறிகள் (Parentheses) கட்டாயமாகும்."
  },
  {
    ch: 1, qNum: 7,
    qText: "Which of the following defines what an object can do?",
    qTamil: "ஒரு பொருள் என்ன செய்ய முடியும் என்பதை வரையறுப்பது எது?",
    optA: "Operating System", optB: "Compiler", optC: "Interface", optD: "Interpreter",
    ans: "C",
    exp: "An interface defines what an object can do (the visible contract or set of actions).",
    expTamil: "இடைமுகம் (Interface) என்பது ஒரு பொருள் என்ன செய்ய முடியும் என்பதை வரையறுக்கிறது."
  },
  {
    ch: 1, qNum: 8,
    qText: "Which of the following carries out the instructions defined in the interface?",
    qTamil: "இடைமுகத்தில் வரையறுக்கப்பட்ட வழிமுறைகளை செயல்படுத்துவது எது?",
    optA: "Operating System", optB: "Compiler", optC: "Implementation", optD: "Interpreter",
    ans: "C",
    exp: "Implementation carries out the instructions and algorithms defined in the interface.",
    expTamil: "செயல்படுத்துதல் (Implementation) என்பது இடைமுகத்தில் உள்ள வழிமுறைகளை நிறைவேற்றுகிறது."
  },
  {
    ch: 1, qNum: 9,
    qText: "The functions which will give exact result when same arguments are passed are called:",
    qTamil: "ஒரே செயலுருபுகள் அனுப்பப்படும் போது எப்போதும் ஒரே சரியான விடையை வழங்கும் செயற்கூறுகள்:",
    optA: "Impure functions", optB: "Partial Functions", optC: "Dynamic Functions", optD: "Pure functions",
    ans: "D",
    exp: "Pure functions always evaluate to the exact same result given the same arguments and possess referential transparency.",
    expTamil: "தூய செயற்கூறுகள் (Pure functions) அதே உள்ளீடுகளுக்கு எப்போதும் ஒரே விடையைத் தரும்."
  },
  {
    ch: 1, qNum: 10,
    qText: "The functions which cause side effects to the arguments passed are called:",
    qTamil: "அனுப்பப்படும் செயலுருபுகளில் பக்கவிளைவுகளை ஏற்படுத்தும் செயற்கூறுகள்:",
    optA: "impure function", optB: "Partial Functions", optC: "Dynamic Functions", optD: "Pure functions",
    ans: "A",
    exp: "Impure functions depend on or mutate external/global state, causing side effects beyond their return value.",
    expTamil: "பக்கவிளைவுகளை ஏற்படுத்தும் செயற்கூறுகள் தூய்மையற்ற செயற்கூறு (Impure function) எனப்படும்."
  },

  // CHAPTER 2
  {
    ch: 2, qNum: 1,
    qText: "Which of the following functions that build the abstract data type?",
    qTamil: "அருவமாக்கப்பட்ட தரவு வகையை உருவாக்கும் செயற்கூறுகள் எவை?",
    optA: "Constructors", optB: "Destructors", optC: "recursive", optD: "Nested",
    ans: "A",
    exp: "Constructors are functions that build the abstract data type.",
    expTamil: "ஆக்கிகள் (Constructors) அருவமாக்கப்பட்ட தரவு வகையை உருவாக்கும் செயற்கூறுகள் ஆகும்."
  },
  {
    ch: 2, qNum: 2,
    qText: "Which of the following functions that retrieve information from the data type?",
    qTamil: "தரவு வகையிலிருந்து தகவலை மீட்டெடுக்கும் செயற்கூறுகள் எவை?",
    optA: "Constructors", optB: "Selectors", optC: "recursive", optD: "Nested",
    ans: "B",
    exp: "Selectors are functions that retrieve information from the abstract data type.",
    expTamil: "தெரிவிப்பிகள் (Selectors) தரவு வகையிலிருந்து தகவலைப் பெறும் செயற்கூறுகள் ஆகும்."
  },
  {
    ch: 2, qNum: 3,
    qText: "The data structure which is a mutable ordered sequence of elements is called:",
    qTamil: "மாற்றக்கூடிய உறுப்புகளின் வரிசைப்படுத்தப்பட்ட தொடர் தரவு அமைப்பு எது?",
    optA: "Built in", optB: "List", optC: "Tuple", optD: "Derived data",
    ans: "B",
    exp: "A List in Python is a mutable ordered sequence of elements.",
    expTamil: "பட்டியல் (List) மாற்றக்கூடிய வரிசைப்படுத்தப்பட்ட தரவு அமைப்பு ஆகும்."
  },
  {
    ch: 2, qNum: 4,
    qText: "A sequence of immutable objects is called:",
    qTamil: "மாற்ற முடியாத பொருள்களின் வரிசை அமைப்பு:",
    optA: "Built in", optB: "List", optC: "Tuple", optD: "Derived data",
    ans: "C",
    exp: "A Tuple is an immutable sequence of elements.",
    expTamil: "டியூப்பிள் (Tuple) மாற்ற முடியாத பொருள்களின் வரிசை அமைப்பாகும்."
  },
  {
    ch: 2, qNum: 5,
    qText: "The data type whose representation is known are called:",
    qTamil: "உருவமைப்பு தெரிந்த தரவு வகை எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Built in datatype", optB: "Derived datatype", optC: "Concrete datatype", optD: "Abstract datatype",
    ans: "C",
    exp: "A concrete data type is a data type whose internal representation is known.",
    expTamil: "உருவமைப்பு தெரிந்த தரவு வகை பருப்பொருள் தரவு வகை (Concrete datatype) எனப்படும்."
  },
  {
    ch: 2, qNum: 6,
    qText: "The data type whose representation is unknown are called:",
    qTamil: "உருவமைப்பு தெரியாத தரவு வகை எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Built in datatype", optB: "Derived datatype", optC: "Concrete datatype", optD: "Abstract datatype",
    ans: "D",
    exp: "An abstract data type is a data type whose internal representation is hidden and unknown outside constructors and selectors.",
    expTamil: "உருவமைப்பு தெரியாத தரவு வகை அருவமாக்கப்பட்ட தரவு வகை (Abstract datatype) எனப்படும்."
  },
  {
    ch: 2, qNum: 7,
    qText: "Which of the following is a compound structure?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது ஒரு கூட்டு கட்டமைப்பு ஆகும்?",
    optA: "Pair", optB: "Triplet", optC: "single", optD: "quadrat",
    ans: "A",
    exp: "A Pair is a compound structure made up of two items.",
    expTamil: "ஜோடி (Pair) என்பது ஒரு கூட்டு அமைப்பாகும்."
  },
  {
    ch: 2, qNum: 8,
    qText: "Bundling two values together into one can be considered as:",
    qTamil: "இரண்டு மதிப்புகளை ஒன்றாக இணைப்பது எவ்வாறு கருதப்படுகிறது?",
    optA: "Pair", optB: "Triplet", optC: "single", optD: "quadrat",
    ans: "A",
    exp: "Bundling two values together into one single entity is called a Pair.",
    expTamil: "இரண்டு மதிப்புகளை ஒன்றாக இணைப்பது ஜோடி (Pair) எனப்படும்."
  },
  {
    ch: 2, qNum: 9,
    qText: "Which of the following allow to name the various parts of a multi-item object?",
    qTamil: "பல உருப்படிகளைக் கொண்ட பொருளின் பல்வேறு பகுதிகளுக்கு பெயரிட அனுமதிப்பது எது?",
    optA: "Tuples", optB: "Lists", optC: "Classes", optD: "quadrats",
    ans: "C",
    exp: "Classes in object-oriented programming allow naming of the various individual attributes and methods of a multi-item object.",
    expTamil: "இனக்குழுக்கள் (Classes) பல உருப்படி பொருள்களின் பகுதிகளுக்கு பெயரிட அனுமதிக்கின்றன."
  },
  {
    ch: 2, qNum: 10,
    qText: "Which of the following is constructed by placing expressions within square brackets?",
    qTamil: "சதுர அடைப்புக்குறிக்குள் [ ] கோவைகளை வைப்பதன் மூலம் உருவாக்கப்படுவது எது?",
    optA: "Tuples", optB: "Lists", optC: "Classes", optD: "quadrats",
    ans: "B",
    exp: "A list is created in Python by placing comma-separated values inside square brackets [].",
    expTamil: "சதுர அடைப்புக்குறிக்குள் கோவைகளை அமைத்து பட்டியல் (Lists) உருவாக்கப்படுகிறது."
  },

  // CHAPTER 3
  {
    ch: 3, qNum: 1,
    qText: "Which of the following refers to the visibility of variables in one part of a program to another part of the same program?",
    qTamil: "நிரலின் ஒரு பகுதியில் உள்ள மாறிகள் மற்ற பகுதியில் தெரிவதை குறிப்பது எது?",
    optA: "Scope", optB: "Memory", optC: "Address", optD: "Accessibility",
    ans: "A",
    exp: "Scope refers to the visibility of variables in one part of a program to another part of the same program.",
    expTamil: "வரையெல்லை (Scope) என்பது மாறிகளின் பார்வைத்திறனைக் குறிக்கிறது."
  },
  {
    ch: 3, qNum: 2,
    qText: "The process of binding a variable name with an object is called:",
    qTamil: "மாறி பெயரை ஒரு பொருளுடன் பிணைக்கும் செயல்முறை:",
    optA: "Scope", optB: "Mapping", optC: "late binding", optD: "early binding",
    ans: "B",
    exp: "The process of binding a variable name with an object is called Mapping.",
    expTamil: "மாறி பெயரை பொருளுடன் இணைப்பது மேப்பிங் (Mapping) எனப்படும்."
  },
  {
    ch: 3, qNum: 3,
    qText: "Which of the following is used in programming languages to map the variable and object?",
    qTamil: "நிரலாக்க மொழிகளில் மாறி மற்றும் பொருளை தொடர்புபடுத்த பயன்படுவது எது?",
    optA: "::", optB: ":=", optC: "=", optD: "==",
    ans: "B",
    exp: "The colon-equal operator (:=) or assignment operator is used in functional languages to map names to objects.",
    expTamil: ":= குறியீடு மாறி மற்றும் பொருளை மேப் செய்யப் பயன்படுகிறது."
  },
  {
    ch: 3, qNum: 4,
    qText: "Containers for mapping names of variables to objects is called:",
    qTamil: "மாறிகளின் பெயர்களை பொருள்களுடன் மேப் செய்வதற்கான கொள்கலன்கள்:",
    optA: "Scope", optB: "Mapping", optC: "Binding", optD: "Namespaces",
    ans: "D",
    exp: "Namespaces are containers for mapping names of variables to objects.",
    expTamil: "பெயர்வெளிகள் (Namespaces) என்பது பெயர்களை பொருள்களுடன் இணைக்கும் கொள்கலன்கள் ஆகும்."
  },
  {
    ch: 3, qNum: 5,
    qText: "Which scope refers to variables defined in current function?",
    qTamil: "தற்போதைய செயற்கூறில் வரையறுக்கப்பட்ட மாறிகளை குறிக்கும் வரையெல்லை எது?",
    optA: "Local Scope", optB: "Global scope", optC: "Module scope", optD: "Function Scope",
    ans: "A",
    exp: "Local scope refers to variables defined inside the current function block.",
    expTamil: "உள்ளமை வரையெல்லை (Local Scope) என்பது தற்போதைய செயற்கூறில் உள்ள மாறிகளைக் குறிக்கும்."
  },
  {
    ch: 3, qNum: 6,
    qText: "The process of subdividing a computer program into separate sub-programs is called:",
    qTamil: "ஒரு கணினி நிரலை தனித்தனி துணை நிரல்களாக பிரிக்கும் செயல்முறை:",
    optA: "Procedural Programming", optB: "Modular programming", optC: "Event Driven Programming", optD: "Object oriented Programming",
    ans: "B",
    exp: "The process of subdividing a computer program into separate sub-programs (modules) is called Modular programming.",
    expTamil: "கூறுநிலை நிரலாக்கம் (Modular programming) என்பது நிரலை கூறுகளாக பிரிக்கும் செயல்முறையாகும்."
  },
  {
    ch: 3, qNum: 7,
    qText: "Which of the following security technique that regulates who can use resources in a computing environment?",
    qTamil: "கணினி சூழலில் வளங்களை யார் பயன்படுத்தலாம் என்பதை கட்டுப்படுத்தும் பாதுகாப்பு நுட்பம் எது?",
    optA: "Password", optB: "Authentication", optC: "Access control", optD: "Certification",
    ans: "C",
    exp: "Access control is a security technique that regulates who or what can view or use resources in a computing environment.",
    expTamil: "அணுகல் கட்டுப்பாடு (Access control) என்பது வளங்களைப் பயன்படுத்துவதை முறைப்படுத்தும் நுட்பமாகும்."
  },
  {
    ch: 3, qNum: 8,
    qText: "Which of the following members of a class can be handled only from within the class?",
    qTamil: "இனக்குழுவின் உறுப்பினர்களில் எது இனக்குழுவிற்குள் மட்டுமே கையாளப்பட முடியும்?",
    optA: "Public members", optB: "Protected members", optC: "Secured members", optD: "Private members",
    ans: "D",
    exp: "Private members of a class can only be accessed or modified from within the class.",
    expTamil: "தனிப்பட்ட உறுப்பினர்கள் (Private members) இனக்குழுவிற்குள் மட்டுமே கையாளப்பட முடியும்."
  },
  {
    ch: 3, qNum: 9,
    qText: "Which members are accessible from outside the class?",
    qTamil: "இனக்குழுவிற்கு வெளியிலிருந்தும் அணுகக்கூடிய உறுப்பினர்கள் எவை?",
    optA: "Public members", optB: "Protected members", optC: "Secured members", optD: "Private members",
    ans: "A",
    exp: "Public members of a class are accessible from both inside and outside the class.",
    expTamil: "பொது உறுப்பினர்கள் (Public members) இனக்குழுவிற்கு வெளியிலிருந்தும் அணுகக்கூடியவை."
  },
  {
    ch: 3, qNum: 10,
    qText: "The members that are accessible from within the class and are also available to its sub-classes is called:",
    qTamil: "இனக்குழுவிற்குள்ளும் அதன் துணை இனக்குழுக்களாலும் அணுகக்கூடிய உறுப்பினர்கள் எவை?",
    optA: "Public members", optB: "Protected members", optC: "Secured members", optD: "Private members",
    ans: "B",
    exp: "Protected members are accessible from within the defining class as well as from its derived subclasses.",
    expTamil: "பாதுகாக்கப்பட்ட உறுப்பினர்கள் (Protected members) துணை இனக்குழுக்களாலும் அணுகக்கூடியவை."
  },

  // CHAPTER 4
  {
    ch: 4, qNum: 1,
    qText: "The word algorithm comes from the name of the 9th-century Persian mathematician:",
    qTamil: "அல்காரிதம் என்ற சொல் எந்த பாரசீக கணிதவியலாளரின் பெயரிலிருந்து வந்தது?",
    optA: "Flowchart", optB: "Flow", optC: "Abu Ja’far Mohammed ibn-i Musa al Khowarizmi", optD: "Syntax",
    ans: "C",
    exp: "The word algorithm originates from the name of the 9th-century Persian mathematician Abu Ja'far Muhammad ibn Musa al-Khwarizmi.",
    expTamil: "அல்காரிதம் என்ற சொல் முகமது இபின் மூசா அல்-குவாரிஸ்மி என்ற கணிதவியலாளரின் பெயரிலிருந்து வந்தது."
  },
  {
    ch: 4, qNum: 2,
    qText: "From the following sorting algorithms which algorithm needs the minimum number of swaps?",
    qTamil: "பின்வரும் வரிசையாக்க நெறிமுறைகளில் குறைந்த எண்ணிக்கையிலான இடமாற்றங்கள் தேவைப்படும் நெறிமுறை எது?",
    optA: "Bubble sort", optB: "Quick sort", optC: "Merge sort", optD: "Selection sort",
    ans: "D",
    exp: "Selection sort makes at most n-1 swaps, which is the minimum number of swaps among elementary comparison sorts.",
    expTamil: "தேர்வு வரிசையாக்கம் (Selection sort) மிகக் குறைந்த இடமாற்றங்களை மட்டுமே செய்யும்."
  },
  {
    ch: 4, qNum: 3,
    qText: "Two main measures for the efficiency of an algorithm are:",
    qTamil: "ஒரு நெறிமுறையின் செயல்திறனுக்கான இரண்டு முக்கிய அளவீடுகள்:",
    optA: "Processor and memory", optB: "Complexity and capacity", optC: "Time and space", optD: "Data and space",
    ans: "C",
    exp: "The efficiency of an algorithm is measured primarily in terms of Time complexity and Space complexity.",
    expTamil: "நேரம் மற்றும் இடம் (Time and space) நெறிமுறையின் செயல்திறனை அளவிடும் இரண்டு காரணிகள் ஆகும்."
  },
  {
    ch: 4, qNum: 4,
    qText: "The complexity of linear search algorithm is:",
    qTamil: "நேரியல் தேடல் நெறிமுறையின் சிக்கல்தன்மை என்ன?",
    optA: "O(n)", optB: "O(log n)", optC: "O(n^2)", optD: "O(n log n)",
    ans: "A",
    exp: "Linear search checks elements one by one sequentially, yielding a worst-case time complexity of O(n).",
    expTamil: "நேரியல் தேடலின் சிக்கல்தன்மை O(n) ஆகும்."
  },
  {
    ch: 4, qNum: 5,
    qText: "From the following sorting algorithms which has the lowest worst case complexity?",
    qTamil: "பின்வரும் வரிசையாக்க நெறிமுறைகளில் மிகக் குறைந்த மோசமான நிலை சிக்கல்தன்மை கொண்ட நெறிமுறை எது?",
    optA: "Bubble sort", optB: "Quick sort", optC: "Merge sort", optD: "Selection sort",
    ans: "C",
    exp: "Merge sort has a guaranteed worst-case time complexity of O(n log n), which is strictly lower than O(n^2) of Bubble, Selection and Quick sort.",
    expTamil: "இணைப்பு வரிசையாக்கம் (Merge sort) O(n log n) சிக்கல்தன்மையைக் கொண்டது."
  },
  {
    ch: 4, qNum: 6,
    qText: "Which of the following is not a stable sorting algorithm?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது நிலையான வரிசையாக்க நெறிமுறை அல்ல?",
    optA: "Insertion sort", optB: "Selection sort", optC: "Bubble sort", optD: "Merge sort",
    ans: "B",
    exp: "Selection sort is not stable because swapping elements over long distances can invert the relative order of identical keys.",
    expTamil: "தேர்வு வரிசையாக்கம் (Selection sort) ஒரு நிலையான வரிசையாக்க நெறிமுறை அல்ல."
  },
  {
    ch: 4, qNum: 7,
    qText: "Time complexity of bubble sort in best case is:",
    qTamil: "குமிழி வரிசையாக்கத்தின் சிறந்த நிலை நேர சிக்கல்தன்மை என்ன?",
    optA: "θ (n)", optB: "θ (n log n)", optC: "θ (n^2)", optD: "θ (n(log n)^2)",
    ans: "A",
    exp: "With an optimized flag detecting zero swaps on pass 1, Bubble Sort's best-case time complexity is θ(n).",
    expTamil: "குமிழி வரிசையாக்கத்தின் சிறந்த நிலை சிக்கல்தன்மை θ(n) ஆகும்."
  },
  {
    ch: 4, qNum: 8,
    qText: "The Θ notation in asymptotic evaluation represents:",
    qTamil: "நெறிமுறை மதிப்பீட்டில் Θ (தீட்டா) குறியீடு எதனைக் குறிக்கிறது?",
    optA: "Base case", optB: "Average case", optC: "Worst case", optD: "NULL case",
    ans: "B",
    exp: "Big Theta (Θ) notation gives tight asymptotic bounds, commonly used for the average-case analysis.",
    expTamil: "Θ குறியீடு சராசரி நிலை (Average case) மதிப்பீட்டைக் குறிக்கிறது."
  },
  {
    ch: 4, qNum: 9,
    qText: "If a problem can be broken into subproblems which are reused several times, the problem possesses which property?",
    qTamil: "ஒரு சிக்கல் பல முறை மீண்டும் பயன்படுத்தப்படும் துணை சிக்கல்களாக பிரிக்கப்பட்டால், அந்த பண்பு எது?",
    optA: "Overlapping subproblems", optB: "Optimal substructure", optC: "Memoization", optD: "Greedy",
    ans: "A",
    exp: "When subproblems are solved repeatedly, the problem exhibits Overlapping Subproblems.",
    expTamil: "மேலெழும் துணை சிக்கல்கள் (Overlapping subproblems) பண்பைக் கொண்டுள்ளது."
  },
  {
    ch: 4, qNum: 10,
    qText: "In dynamic programming, the technique of storing the previously calculated values is called:",
    qTamil: "இயங்கு நிரலாக்கத்தில், முன்பே கணக்கிடப்பட்ட மதிப்புகளை சேமிக்கும் நுட்பம் எது?",
    optA: "Saving value property", optB: "Storing value property", optC: "Memoization", optD: "Mapping",
    ans: "C",
    exp: "Memoization is an optimization technique used primarily to speed up programs by storing the results of expensive function calls.",
    expTamil: "நினைவிருத்தல் (Memoization) என்பது கணக்கிடப்பட்ட மதிப்புகளை சேமிக்கும் நுட்பமாகும்."
  },

  // CHAPTER 5
  {
    ch: 5, qNum: 1,
    qText: "Who developed Python?",
    qTamil: "பைத்தானை உருவாக்கியவர் யார்?",
    optA: "Dennis Ritchie", optB: "Guido Van Rossum", optC: "Bill Gates", optD: "Sundar Pichai",
    ans: "B",
    exp: "Python was conceived in the late 1980s by Guido van Rossum at CWI in the Netherlands.",
    expTamil: "பைத்தான் கைடோ வான் ரோஸம் (Guido Van Rossum) என்பவரால் உருவாக்கப்பட்டது."
  },
  {
    ch: 5, qNum: 2,
    qText: "The Python prompt indicates that Interpreter is ready to accept instruction:",
    qTamil: "மொழிபெயர்ப்பி கட்டளைகளை ஏற்க தயாராக உள்ளது என்பதைக் குறிக்கும் பைத்தான் தூண்டு குறி எது?",
    optA: ">>>", optB: "<<<", optC: "#", optD: "<<",
    ans: "A",
    exp: "The primary interactive prompt symbol in Python is >>>.",
    expTamil: ">>> என்பது பைத்தான் ஊடாடும் முறை தூண்டுகுறி ஆகும்."
  },
  {
    ch: 5, qNum: 3,
    qText: "Which of the following shortcut is used to create new Python Program file in IDLE?",
    qTamil: "புதிய பைத்தான் நிரல் கோப்பை உருவாக்க பயன்படும் குறுக்குவழி சாவி எது?",
    optA: "Ctrl + C", optB: "Ctrl + F", optC: "Ctrl + B", optD: "Ctrl + N",
    ans: "D",
    exp: "Ctrl + N creates a new script editor window in Python IDLE.",
    expTamil: "Ctrl + N புதிய நிரல் கோப்பை உருவாக்க பயன்படுகிறது."
  },
  {
    ch: 5, qNum: 4,
    qText: "Which of the following character is used to give comments in Python Program?",
    qTamil: "பைத்தான் நிரலில் குறிப்புரைகளை எழுத பயன்படும் குறியீடு எது?",
    optA: "#", optB: "&", optC: "@", optD: "$",
    ans: "A",
    exp: "Single-line comments in Python begin with the hash character #.",
    expTamil: "# குறியீடு பைத்தானில் குறிப்புரைகளை எழுத பயன்படுகிறது."
  },
  {
    ch: 5, qNum: 5,
    qText: "This symbol is used to print more than one item on a single line with print():",
    qTamil: "ஒரே வரியில் ஒன்றுக்கு மேற்பட்ட உருப்படிகளை அச்சிட பயன்படும் குறியீடு எது?",
    optA: "Semicolon(;)", optB: "Dollar($)", optC: "comma(,)", optD: "Colon(:)",
    ans: "C",
    exp: "Comma (,) is used to separate multiple items inside print().",
    expTamil: "காற்புள்ளி (,) ஒரே வரியில் பல உருப்படிகளை அச்சிட பயன்படுகிறது."
  },
  {
    ch: 5, qNum: 6,
    qText: "Which of the following is not a token in Python?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது பைத்தானின் டோக்கன் (வில்லை) அல்ல?",
    optA: "Interpreter", optB: "Identifiers", optC: "Keyword", optD: "Operators",
    ans: "A",
    exp: "The 5 tokens in Python are Identifiers, Keywords, Operators, Delimiters, and Literals. Interpreter is the language processor, not a token.",
    expTamil: "மொழிபெயர்ப்பி (Interpreter) என்பது டோக்கன் அல்ல."
  },
  {
    ch: 5, qNum: 7,
    qText: "Which of the following is not a Keyword in Python?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது பைத்தானின் சிறப்புச்சொல் அல்ல?",
    optA: "break", optB: "while", optC: "continue", optD: "operators",
    ans: "D",
    exp: "break, while, continue are built-in reserved keywords. 'operators' is not a keyword.",
    expTamil: "operators என்பது சிறப்புச்சொல் அல்ல."
  },
  {
    ch: 5, qNum: 8,
    qText: "Which operator is also called as Comparative operator?",
    qTamil: "ஒப்பீட்டு செயற்குறி என்று அழைக்கப்படும் செயற்குறி எது?",
    optA: "Arithmetic", optB: "Relational", optC: "Logical", optD: "Assignment",
    ans: "B",
    exp: "Relational operators (==, !=, <, >, <=, >=) compare operands and are also known as Comparative operators.",
    expTamil: "தொடர்பு செயற்குறி (Relational) ஒப்பீட்டு செயற்குறி என்றும் அழைக்கப்படுகிறது."
  },
  {
    ch: 5, qNum: 9,
    qText: "Which of the following is not a Logical operator in Python?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது பைத்தானின் தருக்க செயற்குறி அல்ல?",
    optA: "and", optB: "or", optC: "not", optD: "Assignment",
    ans: "D",
    exp: "Python logical operators are and, or, and not. Assignment (=) is not a logical operator.",
    expTamil: "Assignment செயற்குறி தருக்க செயற்குறி அல்ல."
  },
  {
    ch: 5, qNum: 10,
    qText: "Which operator is also called as Conditional operator in Python?",
    qTamil: "நிபந்தனை செயற்குறி என்று அழைக்கப்படும் செயற்குறி எது?",
    optA: "Ternary", optB: "Relational", optC: "Logical", optD: "Assignment",
    ans: "A",
    exp: "The Ternary operator evaluates a condition in a single line and is known as the Conditional operator.",
    expTamil: "மூன்றும செயற்குறி (Ternary) நிபந்தனை செயற்குறி எனப்படும்."
  },

  // CHAPTER 6
  {
    ch: 6, qNum: 1,
    qText: "How many important control structures are there in Python?",
    qTamil: "பைத்தானில் எத்தனை முக்கியமான கட்டுப்பாட்டு அமைப்புகள் உள்ளன?",
    optA: "3", optB: "4", optC: "5", optD: "6",
    ans: "A",
    exp: "The 3 fundamental control structures are Sequential, Alternative/Branching, and Iterative/Looping.",
    expTamil: "வரிசைமுறை, கிளைபிரித்தல், சுழற்சி என 3 கட்டுப்பாட்டு அமைப்புகள் உள்ளன."
  },
  {
    ch: 6, qNum: 2,
    qText: "elif can be considered to be abbreviation of:",
    qTamil: "elif என்பது எதன் சுருக்கம்?",
    optA: "nested if", optB: "if..else", optC: "else if", optD: "if..elif",
    ans: "C",
    exp: "In Python, 'elif' stands for 'else if'.",
    expTamil: "elif என்பது 'else if' என்பதன் சுருக்கம் ஆகும்."
  },
  {
    ch: 6, qNum: 3,
    qText: "What plays a vital role in Python programming for grouping statements into blocks?",
    qTamil: "பைத்தானில் கூற்றுகளை தொகுதிகளாக பிரிக்க முக்கிய பங்கு வகிப்பது எது?",
    optA: "Statements", optB: "Control", optC: "Structure", optD: "Indentation",
    ans: "D",
    exp: "Indentation (whitespace) defines statement blocks and scope in Python instead of curly braces.",
    expTamil: "உள்தள்ளல் (Indentation) கூற்றுகளை தொகுதிகளாக பிரிக்க உதவுகிறது."
  },
  {
    ch: 6, qNum: 4,
    qText: "Which statement is generally used as a placeholder in Python?",
    qTamil: "பைத்தானில் வெற்று இடம்பிடிப்பானாக (placeholder) பயன்படும் கூற்று எது?",
    optA: "continue", optB: "break", optC: "pass", optD: "goto",
    ans: "C",
    exp: "The pass statement is a null operation used as a placeholder where code will eventually go.",
    expTamil: "pass கூற்று ஒரு வெற்று இடம்பிடிப்பானாக பயன்படுகிறது."
  },
  {
    ch: 6, qNum: 5,
    qText: "The condition in the if statement should be in the form of:",
    qTamil: "if கூற்றில் உள்ள நிபந்தனை எந்த வடிவில் இருக்க வேண்டும்?",
    optA: "Arithmetic or Relational expression", optB: "Arithmetic or Logical expression", optC: "Relational or Logical expression", optD: "Arithmetic",
    ans: "C",
    exp: "An if condition must evaluate to a boolean value, formed using Relational or Logical expressions.",
    expTamil: "தொடர்பு அல்லது தருக்க கோவை வடிவில் இருக்க வேண்டும்."
  },
  {
    ch: 6, qNum: 6,
    qText: "Which is the most comfortable and commonly used loop in Python for traversing sequences?",
    qTamil: "தொடர்களை உலாவ பைத்தானில் மிகவும் வசதியான சுழற்சி எது?",
    optA: "do..while", optB: "while", optC: "for", optD: "if..elif",
    ans: "C",
    exp: "The for loop is an entry-controlled loop that is most comfortable and concise for iterating over sequences.",
    expTamil: "for சுழற்சி மிகவும் வசதியான சுழற்சி ஆகும்."
  },
  {
    ch: 6, qNum: 7,
    qText: "What is the output of the following snippet? i=1; while True: if i%3 == 0: break; print(i,end=''); i += 1",
    qTamil: "i=1; while True: if i%3 == 0: break; print(i,end=''); i += 1 - வெளியீடு என்ன?",
    optA: "12", optB: "123", optC: "1234", optD: "124",
    ans: "A",
    exp: "When i=1, prints 1. When i=2, prints 2. When i=3, i%3==0 is true, so break terminates the loop. Output: 12.",
    expTamil: "i=3 ஆகும் போது சுழற்சி முடிவடைவதால் வெளியீடு 12 ஆகும்."
  },
  {
    ch: 6, qNum: 8,
    qText: "What is the output of the following snippet? T=1; while T: print(True); break",
    qTamil: "T=1; while T: print(True); break - வெளியீடு என்ன?",
    optA: "False", optB: "True", optC: "0", optD: "1",
    ans: "B",
    exp: "T=1 is truthy. The while condition evaluates to true, prints True, and immediately hits break.",
    expTamil: "நிபந்தனை மெய் என்பதால் True அச்சிடப்பட்டு சுழற்சி முடிகிறது."
  },
  {
    ch: 6, qNum: 9,
    qText: "Which amongst this is not a jump statement in Python?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது தாவல் கூற்று அல்ல?",
    optA: "for", optB: "pass", optC: "continue", optD: "break",
    ans: "A",
    exp: "break, continue, and pass are jump/transfer statements. 'for' is an iterative looping structure.",
    expTamil: "for என்பது ஒரு சுழற்சி கூற்று, தாவல் கூற்று அல்ல."
  },
  {
    ch: 6, qNum: 10,
    qText: "Which punctuation should be used at the end of the if condition line? if <condition>_",
    qTamil: "if <condition>_ முடிவில் எந்த நிறுத்தற்குறி பயன்படுத்தப்பட வேண்டும்?",
    optA: ";", optB: ":", optC: "::", optD: "!",
    ans: "B",
    exp: "Python compound statements like if, else, for, while must end with a colon (:).",
    expTamil: "முக்கால்புள்ளி (:) பயன்படுத்தப்பட வேண்டும்."
  },

  // CHAPTER 7
  {
    ch: 7, qNum: 1,
    qText: "A named block of code that is designed to do one specific job is called as:",
    qTamil: "ஒரு குறிப்பிட்ட வேலையைச் செய்ய வடிவமைக்கப்பட்ட பெயரிடப்பட்ட தொகுதி:",
    optA: "Loop", optB: "Branching", optC: "Function", optD: "Block",
    ans: "C",
    exp: "Functions are named blocks of code designed to do one specific job and can be reused.",
    expTamil: "செயற்கூறு (Function) என்பது குறிப்பிட்ட பணியைச் செய்யும் பெயரிடப்பட்ட தொகுதி ஆகும்."
  },
  {
    ch: 7, qNum: 2,
    qText: "A Function which calls itself is called as:",
    qTamil: "தன்னைத்தானே அழைத்துக் கொள்ளும் செயற்கூறு எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Built-in", optB: "Recursion", optC: "Lambda", optD: "return",
    ans: "B",
    exp: "A function that calls itself directly or indirectly is known as a recursive function.",
    expTamil: "தற்சுழற்சி (Recursion) என்பது தன்னைத்தானே அழைத்துக் கொள்ளும் செயற்கூறு ஆகும்."
  },
  {
    ch: 7, qNum: 3,
    qText: "Which function is called anonymous un-named function in Python?",
    qTamil: "பைத்தானில் பெயரற்ற செயற்கூறு என்று அழைக்கப்படுவது எது?",
    optA: "Lambda", optB: "Recursion", optC: "Function", optD: "define",
    ans: "A",
    exp: "Anonymous functions in Python are defined with the lambda keyword without a def name.",
    expTamil: "லேம்ப்டா (Lambda) என்பது பெயரற்ற செயற்கூறு ஆகும்."
  },
  {
    ch: 7, qNum: 4,
    qText: "Which of the following keyword is used to begin the function block?",
    qTamil: "செயற்கூறு தொகுதியை தொடங்க பயன்படும் சிறப்புச்சொல் எது?",
    optA: "define", optB: "for", optC: "finally", optD: "def",
    ans: "D",
    exp: "The 'def' keyword initiates the definition of a user-defined function in Python.",
    expTamil: "def சிறப்புச்சொல் செயற்கூறை வரையறுக்க தொடங்குகிறது."
  },
  {
    ch: 7, qNum: 5,
    qText: "Which of the following keyword is used to exit a function and optionally send back a value?",
    qTamil: "செயற்கூறிலிருந்து வெளியேறி மதிப்பைத் திருப்பி அனுப்ப பயன்படும் சிறப்புச்சொல் எது?",
    optA: "define", optB: "return", optC: "finally", optD: "def",
    ans: "B",
    exp: "The 'return' statement exits a function and passes back an expression to the caller.",
    expTamil: "return கூற்று செயற்கூறிலிருந்து மதிப்பை திருப்பி அனுப்ப பயன்படுகிறது."
  },
  {
    ch: 7, qNum: 6,
    qText: "While defining a function header in Python, which of the following symbol is used at the end?",
    qTamil: "செயற்கூறு தலைப்பின் முடிவில் எந்த குறியீடு பயன்படுத்தப்படுகிறது?",
    optA: "; (semicolon)", optB: ". (dot)", optC: ": (colon)", optD: "$ (dollar)",
    ans: "C",
    exp: "Every function header in Python terminates with a colon (:).",
    expTamil: ": (முக்கால்புள்ளி) குறியீடு பயன்படுத்தப்படுகிறது."
  },
  {
    ch: 7, qNum: 7,
    qText: "In which arguments type must arguments be passed to a function in correct positional order?",
    qTamil: "எந்த வகை செயலுருபுகளில் சரியான வரிசைமுறையில் செயலுருபுகள் அனுப்பப்பட வேண்டும்?",
    optA: "Required / Positional", optB: "Keyword", optC: "Default", optD: "Variable-length",
    ans: "A",
    exp: "Positional or required arguments must match the parameter list in exact quantity and order.",
    expTamil: "தேவையான செயலுருபுகள் (Required) சரியான வரிசையில் அனுப்பப்பட வேண்டும்."
  },
  {
    ch: 7, qNum: 8,
    qText: "Read the statements: (I) In Python, you don't have to mention the specific data types while defining function. (II) Python keywords can be used as function name.",
    qTamil: "கூற்றுகளைப் படிக்கவும்: (I) தரவு வகைகளை குறிப்பிடத் தேவையில்லை. (II) சிறப்புச்சொற்களை செயற்கூறு பெயராகப் பயன்படுத்தலாம்.",
    optA: "I is correct and II is wrong", optB: "Both are correct", optC: "I is wrong and II is correct", optD: "Both are wrong",
    ans: "A",
    exp: "Python is dynamically typed so types are not required in parameters. Reserved keywords cannot be used as function identifiers.",
    expTamil: "I சரியானது மற்றும் II தவறானது."
  },
  {
    ch: 7, qNum: 9,
    qText: "Pick the correct condition to execute successfully: if ____ : print(x, 'is a leap year')",
    qTamil: "சரியான நிபந்தனையைத் தேர்வு செய்யவும்: if ____ : print(x, 'is a leap year')",
    optA: "x%2=0", optB: "x%4==0", optC: "x/4=0", optD: "x%4=0",
    ans: "B",
    exp: "Equality comparison requires == (x % 4 == 0).",
    expTamil: "சமநிலை ஒப்பீட்டுக்கு == தேவை (x%4==0)."
  },
  {
    ch: 7, qNum: 10,
    qText: "Which of the following keyword is used to define the function testpython(): ?",
    qTamil: "testpython(): செயற்கூறை வரையறுக்க பயன்படும் சிறப்புச்சொல் எது?",
    optA: "define", optB: "pass", optC: "def", optD: "while",
    ans: "C",
    exp: "User functions are defined with 'def'.",
    expTamil: "def சிறப்புச்சொல் மூலம் வரையறுக்கப்படுகிறது."
  },

  // CHAPTER 8
  {
    ch: 8, qNum: 1,
    qText: "What is the output of the following python code? str1='TamilNadu'; print(str1[::-1])",
    qTamil: "str1='TamilNadu'; print(str1[::-1]) - வெளியீடு என்ன?",
    optA: "Tamilnadu", optB: "Tmlau", optC: "udanlimaT", optD: "udaNlimaT",
    ans: "D",
    exp: "A step stride of -1 reverses the string while preserving letter case: udaNlimaT.",
    expTamil: "-1 படிநிலை சரத்தை தலைகீழாக மாற்றும்: udaNlimaT."
  },
  {
    ch: 8, qNum: 2,
    qText: "What will be the output of the following code? str1 = 'Chennai Schools'; str1[7] = '-'",
    qTamil: "str1 = 'Chennai Schools'; str1[7] = '-' - வெளியீடு என்ன?",
    optA: "Chennai-Schools", optB: "Chenna-School", optC: "TypeError", optD: "Chennai",
    ans: "C",
    exp: "Strings in Python are immutable; item assignment raises a TypeError.",
    expTamil: "சரங்கள் மாற்ற முடியாதவை என்பதால் TypeError ஏற்படும்."
  },
  {
    ch: 8, qNum: 3,
    qText: "Which of the following operator is used for string concatenation?",
    qTamil: "சரங்களை இணைக்க பயன்படும் செயற்குறி எது?",
    optA: "+", optB: "&", optC: "*", optD: "=",
    ans: "A",
    exp: "The plus (+) operator concatenates two strings together.",
    expTamil: "+ செயற்குறி சரங்களை இணைக்க பயன்படுகிறது."
  },
  {
    ch: 8, qNum: 4,
    qText: "Defining strings within triple quotes (''' or \"\"\") allows creating:",
    qTamil: "மூன்று மேற்கோள் குறிகளுக்குள் சரங்களை வரையறுப்பது எதனை உருவாக்க அனுமதிக்கிறது?",
    optA: "Single line Strings", optB: "Multiline Strings", optC: "Double line Strings", optD: "Multiple Strings",
    ans: "B",
    exp: "Triple quotes allow strings to span across multiple lines.",
    expTamil: "பலவரி சரங்கள் (Multiline Strings) உருவாக்க அனுமதிக்கிறது."
  },
  {
    ch: 8, qNum: 5,
    qText: "Strings in Python are:",
    qTamil: "பைத்தானில் சரங்கள்:",
    optA: "Changeable", optB: "Mutable", optC: "Immutable", optD: "flexible",
    ans: "C",
    exp: "Strings in Python cannot be changed after creation, making them Immutable.",
    expTamil: "சரங்கள் மாற்ற முடியாதவை (Immutable) ஆகும்."
  },
  {
    ch: 8, qNum: 6,
    qText: "Which of the following is the slicing operator in Python?",
    qTamil: "பைத்தானில் பிரித்தெடுக்கும் (slicing) செயற்குறி எது?",
    optA: "{ }", optB: "[ ]", optC: "< >", optD: "( )",
    ans: "B",
    exp: "Square brackets [start:stop:step] are used for slice operations.",
    expTamil: "[ ] சதுர அடைப்புக்குறி பிரித்தெடுக்கும் செயற்குறியாகும்."
  },
  {
    ch: 8, qNum: 7,
    qText: "What is stride in string slice operation [start:end:stride]?",
    qTamil: "சர பிரித்தெடுத்தலில் stride என்பது என்ன?",
    optA: "index value of slide operation", optB: "first argument of slice operation", optC: "second argument of slice operation", optD: "third argument of slice operation",
    ans: "D",
    exp: "Stride is the optional third argument specifying the step increment in a slice.",
    expTamil: "பிரித்தெடுத்தல் செயல்பாட்டின் மூன்றாவது செயலுருபு ஆகும்."
  },
  {
    ch: 8, qNum: 8,
    qText: "Which formatting character is used to print exponential notation in uppercase?",
    qTamil: "அடுக்குக்குறி குறியீட்டை பெரிய எழுத்தில் அச்சிட பயன்படும் வடிவமைப்பு எழுத்து எது?",
    optA: "%e", optB: "%E", optC: "%g", optD: "%n",
    ans: "B",
    exp: "%E formats floating point numbers in uppercase exponential scientific notation.",
    expTamil: "%E அடுக்குக்குறியீட்டை பெரிய எழுத்தில் அச்சிடுகிறது."
  },
  {
    ch: 8, qNum: 9,
    qText: "Which of the following is used as placeholders or replacement fields with format() function?",
    qTamil: "format() செயற்கூறில் இடம்பிடிப்பானாக பயன்படுவது எது?",
    optA: "{ }", optB: "< >", optC: "++", optD: "^^",
    ans: "A",
    exp: "Curly braces {} are replacement fields in format().",
    expTamil: "{ } அடைப்புக்குறிகள் இடம்பிடிப்பானாக பயன்படுகின்றன."
  },
  {
    ch: 8, qNum: 10,
    qText: "The subscript index of a string in Python may be:",
    qTamil: "பைத்தானில் சரத்தின் கீழ்ஒட்டு குறியீட்டெண் (index) எவ்வாறு இருக்கலாம்?",
    optA: "Positive", optB: "Negative", optC: "Both (a) and (b)", optD: "Either (a) or (b)",
    ans: "C",
    exp: "Python supports positive indices (from 0 left to right) and negative indices (from -1 right to left).",
    expTamil: "நேர்மறை மற்றும் எதிர்மறை இரண்டும் இருக்கலாம்."
  },

  // CHAPTER 9
  {
    ch: 9, qNum: 1,
    qText: "Pick odd one in connection with collection data types in Python:",
    qTamil: "பைத்தான் தொகுப்பு தரவு வகைகளில் பொருந்தாத ஒன்றைத் தேர்வு செய்க:",
    optA: "List", optB: "Tuple", optC: "Dictionary", optD: "Loop",
    ans: "D",
    exp: "List, Tuple, and Dictionary are collection data types. Loop is a control structure.",
    expTamil: "Loop என்பது ஒரு கட்டுப்பாட்டு அமைப்பு, தரவு வகை அல்ல."
  },
  {
    ch: 9, qNum: 2,
    qText: "Let list1=[2,4,6,8,10], then print(list1[-2]) will result in:",
    qTamil: "list1=[2,4,6,8,10] எனில், print(list1[-2]) வெளியீடு என்ன?",
    optA: "10", optB: "8", optC: "4", optD: "6",
    ans: "B",
    exp: "Index -1 is 10, and -2 is 8.",
    expTamil: "-2 குறியீட்டெண் கொண்ட உறுப்பு 8 ஆகும்."
  },
  {
    ch: 9, qNum: 3,
    qText: "Which of the following function is used to count the number of elements in a list?",
    qTamil: "பட்டியலில் உள்ள உறுப்புகளின் எண்ணிக்கையை கணக்கிட பயன்படும் செயற்கூறு எது?",
    optA: "count()", optB: "find()", optC: "len()", optD: "index()",
    ans: "C",
    exp: "len() returns the total number of items in a sequence.",
    expTamil: "len() செயற்கூறு உறுப்புகளின் எண்ணிக்கையைத் தரும்."
  },
  {
    ch: 9, qNum: 4,
    qText: "If List=[10,20,30,40,50], then List[2]=35 will result in:",
    qTamil: "List=[10,20,30,40,50] எனில், List[2]=35 என்ன முடிவைத் தரும்?",
    optA: "[35,10,20,30,40,50]", optB: "[10,20,30,40,50,35]", optC: "[10,20,35,40,50]", optD: "[10,35,30,40,50]",
    ans: "C",
    exp: "Index 2 corresponds to 30, which gets replaced by 35.",
    expTamil: "இண்டெக்ஸ் 2-ல் உள்ள 30 மதிப்பு 35 என மாற்றப்படும்."
  },
  {
    ch: 9, qNum: 5,
    qText: "If List=[17,23,41,10], then List.append(32) will result in:",
    qTamil: "List=[17,23,41,10] எனில், List.append(32) என்ன முடிவைத் தரும்?",
    optA: "[32,17,23,41,10]", optB: "[17,23,41,10,32]", optC: "[10,17,23,32,41]", optD: "[41,32,23,17,10]",
    ans: "B",
    exp: "append() adds an item to the end of the list.",
    expTamil: "append() பட்டியலின் இறுதியில் உறுப்பை சேர்க்கும்."
  },
  {
    ch: 9, qNum: 6,
    qText: "Which of the following Python function can be used to add more than one element to an existing list?",
    qTamil: "ஒரு பட்டியலில் ஒன்றுக்கு மேற்பட்ட உறுப்புகளை சேர்க்க பயன்படும் செயற்கூறு எது?",
    optA: "append()", optB: "append_more()", optC: "extend()", optD: "more()",
    ans: "C",
    exp: "extend() appends all elements from an iterable to the end of the list.",
    expTamil: "extend() பல உறுப்புகளை பட்டியலில் சேர்க்கிறது."
  },
  {
    ch: 9, qNum: 7,
    qText: "What is the output of the list comprehension: S=[x**2 for x in range(5)]; print(S)?",
    qTamil: "S=[x**2 for x in range(5)]; print(S) - வெளியீடு என்ன?",
    optA: "[0,1,2,4,5]", optB: "[0,1,4,9,16]", optC: "[0,1,4,9,16,25]", optD: "[1,4,9,16,25]",
    ans: "B",
    exp: "range(5) gives 0, 1, 2, 3, 4. Their squares are 0, 1, 4, 9, 16.",
    expTamil: "0, 1, 2, 3, 4 ஆகியவற்றின் வர்க்கங்கள் [0, 1, 4, 9, 16] ஆகும்."
  },
  {
    ch: 9, qNum: 8,
    qText: "What is the use of type() function in Python?",
    qTamil: "பைத்தானில் type() செயற்கூறின் பயன் என்ன?",
    optA: "To create a Tuple", optB: "To know the type of an element in tuple", optC: "To know the data type of python object", optD: "To create a list",
    ans: "C",
    exp: "type() returns the class / data type of any Python object.",
    expTamil: "பைத்தான் பொருளின் தரவு வகையை அறிய பயன்படுகிறது."
  },
  {
    ch: 9, qNum: 9,
    qText: "Which of the following statement is not correct?",
    qTamil: "பின்வரும் கூற்றுகளில் எது சரியானது அல்ல?",
    optA: "A list is mutable", optB: "A tuple is immutable", optC: "The append() function is used to add an element", optD: "The extend() function is used in tuple to add elements in a list",
    ans: "D",
    exp: "Tuples are immutable and do not have an extend() method.",
    expTamil: "டியூப்பிள்களில் extend() முறை கிடையாது."
  },
  {
    ch: 9, qNum: 10,
    qText: "Let setA={3,6,9}, setB={1,3,9}. What will be the result of print(setA | setB)?",
    qTamil: "setA={3,6,9}, setB={1,3,9} எனில், print(setA | setB) என்ன வெளியீட்டைத் தரும்?",
    optA: "{3,6,9,1,3,9}", optB: "{3,9}", optC: "{1}", optD: "{1,3,6,9}",
    ans: "D",
    exp: "The pipe symbol (|) computes the union of two sets without duplicates: {1, 3, 6, 9}.",
    expTamil: "சேர்ப்பு செயல்பாடு (Union) {1, 3, 6, 9} விடையைத் தரும்."
  },

  // CHAPTER 10
  {
    ch: 10, qNum: 1,
    qText: "Which of the following are the key features of an Object Oriented Programming language?",
    qTamil: "பொருள் நோக்கு நிரலாக்க மொழியின் முக்கிய அம்சங்கள் எவை?",
    optA: "Constructor and Classes", optB: "Constructor and Object", optC: "Classes and Objects", optD: "Constructor and Destructor",
    ans: "C",
    exp: "Classes and Objects are the fundamental building blocks of OOP.",
    expTamil: "இனக்குழுக்கள் மற்றும் பொருள்கள் (Classes and Objects) ஆகும்."
  },
  {
    ch: 10, qNum: 2,
    qText: "Functions defined inside a class are called:",
    qTamil: "இனக்குழுவிற்குள் வரையறுக்கப்படும் செயற்கூறுகள் எவ்வாறு அழைக்கப்படுகின்றன?",
    optA: "Functions", optB: "Module", optC: "Methods", optD: "section",
    ans: "C",
    exp: "Functions defined within the body of a class are called Methods.",
    expTamil: "இனக்குழுவிற்குள் உள்ள செயற்கூறுகள் வழிமுறைகள் (Methods) எனப்படும்."
  },
  {
    ch: 10, qNum: 3,
    qText: "Class members are accessed through which operator?",
    qTamil: "இனக்குழுவின் உறுப்பினர்கள் எந்த செயற்குறி மூலம் அணுகப்படுகிறார்கள்?",
    optA: "&", optB: ".", optC: "#", optD: "%",
    ans: "B",
    exp: "The dot operator (.) accesses attributes and methods of an object or class.",
    expTamil: "புள்ளி செயற்குறி (.) மூலம் அணுகப்படுகிறார்கள்."
  },
  {
    ch: 10, qNum: 4,
    qText: "Which of the following method is automatically executed when an object is created?",
    qTamil: "ஒரு பொருள் உருவாக்கப்படும் போது தானாகவே இயங்கும் முறை எது?",
    optA: "__object__( )", optB: "__del__( )", optC: "__func__( )", optD: "__init__( )",
    ans: "D",
    exp: "__init__() is the constructor method in Python called automatically upon instantiation.",
    expTamil: "__init__() ஆக்கி முறை தானாகவே இயங்கும்."
  },
  {
    ch: 10, qNum: 5,
    qText: "A private class variable in Python is prefixed with:",
    qTamil: "பைத்தானில் தனிப்பட்ட மாறி எதனால் முன்னொட்டாக தொடங்குகிறது?",
    optA: "__", optB: "&&", optC: "##", optD: "**",
    ans: "A",
    exp: "Double underscores (__variable) prefix private class members in Python.",
    expTamil: "இரட்டை அடிக்கோடு (__) முன்னொட்டாக பயன்படுத்தப்படுகிறது."
  },
  {
    ch: 10, qNum: 6,
    qText: "Which of the following method is used as destructor in Python?",
    qTamil: "பைத்தானில் அழிப்பியாக பயன்படும் முறை எது?",
    optA: "__init__( )", optB: "__dest__( )", optC: "__rem__( )", optD: "__del__( )",
    ans: "D",
    exp: "The __del__() method is the destructor called when an object is about to be destroyed.",
    expTamil: "__del__() முறை அழிப்பியாக பயன்படுகிறது."
  },
  {
    ch: 10, qNum: 7,
    qText: "Which of the following class declaration syntax is correct in Python?",
    qTamil: "பின்வரும் இனக்குழு அறிவிப்புகளில் எது சரியானது?",
    optA: "class class_name", optB: "class class_name<>", optC: "class class_name:", optD: "class class_name[ ]",
    ans: "C",
    exp: "Class definition header must end with a colon: class class_name:.",
    expTamil: "class class_name: சரியானது."
  },
  {
    ch: 10, qNum: 8,
    qText: "Output of: class Student: def __init__(self, name): self.name=name; print(self.name); S=Student('Tamil')",
    qTamil: "class Student: def __init__(self, name): self.name=name; print(self.name); S=Student('Tamil') - வெளியீடு என்ன?",
    optA: "Error", optB: "Tamil", optC: "name", optD: "self",
    ans: "B",
    exp: "Instantiating Student('Tamil') triggers __init__ which prints 'Tamil'.",
    expTamil: "Tamil அச்சிடப்படும்."
  },
  {
    ch: 10, qNum: 9,
    qText: "Which of the following is the private class variable?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது தனிப்பட்ட மாறி ஆகும்?",
    optA: "__num", optB: "##num", optC: "$$num", optD: "&&num",
    ans: "A",
    exp: "__num is a private member due to the double underscore prefix.",
    expTamil: "__num தனிப்பட்ட மாறி ஆகும்."
  },
  {
    ch: 10, qNum: 10,
    qText: "The process of creating an object from a class is called as:",
    qTamil: "இனக்குழுவிலிருந்து பொருளை உருவாக்கும் செயல்முறை எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Constructor", optB: "Destructor", optC: "Initialize", optD: "Instantiation",
    ans: "D",
    exp: "Creating an instance/object of a class is called Instantiation.",
    expTamil: "சான்றாக்குதல் (Instantiation) எனப்படும்."
  },

  // CHAPTER 11
  {
    ch: 11, qNum: 1,
    qText: "What is the acronym of DBMS?",
    qTamil: "DBMS என்பதன் விரிவாக்கம் என்ன?",
    optA: "DataBase Management Symbol", optB: "Database Managing System", optC: "DataBase Management System", optD: "DataBasic Management System",
    ans: "C",
    exp: "DBMS stands for Database Management System.",
    expTamil: "Database Management System (தரவுத்தள மேலாண்மை அமைப்பு)."
  },
  {
    ch: 11, qNum: 2,
    qText: "In a relational database model, a table is known as:",
    qTamil: "உறவுநிலை தரவுத்தள மாதிரியில், ஒரு அட்டவணை எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "tuple", optB: "attribute", optC: "relation", optD: "entity",
    ans: "C",
    exp: "In relational database terminology, a table is formally known as a Relation.",
    expTamil: "அட்டவணை உறவு (Relation) எனப்படும்."
  },
  {
    ch: 11, qNum: 3,
    qText: "Which database model represents parent-child relationship?",
    qTamil: "பெற்றோர்-குழந்தை உறவை பிரதிநிதித்துவப்படுத்தும் தரவுத்தள மாதிரி எது?",
    optA: "Relational", optB: "Network", optC: "Hierarchical", optD: "Object",
    ans: "C",
    exp: "The Hierarchical model organizes data in a tree structure where each record has one parent.",
    expTamil: "படிநிலை மாதிரி (Hierarchical model) பெற்றோர்-குழந்தை உறவை பிரதிபலிக்கிறது."
  },
  {
    ch: 11, qNum: 4,
    qText: "Relational database model was first proposed by:",
    qTamil: "உறவுநிலை தரவுத்தள மாதிரியை முதலில் முன்மொழிந்தவர் யார்?",
    optA: "E F Codd", optB: "E E Codd", optC: "E F Cadd", optD: "E F Codder",
    ans: "A",
    exp: "Dr. Edgar Frank Codd (E. F. Codd) proposed the relational model in 1970 at IBM.",
    expTamil: "டாக்டர் E. F. காட் (E F Codd) உறவுநிலை மாதிரியை முன்மொழிந்தார்."
  },
  {
    ch: 11, qNum: 5,
    qText: "What type of relationship does hierarchical model represent?",
    qTamil: "படிநிலை மாதிரி எந்த வகை உறவை குறிக்கிறது?",
    optA: "one-to-one", optB: "one-to-many", optC: "many-to-one", optD: "many-to-many",
    ans: "B",
    exp: "Hierarchical databases represent a 1:N (one-to-many) relationship between parents and children.",
    expTamil: "ஒன்றிலிருந்து பல (one-to-many) உறவை குறிக்கிறது."
  },
  {
    ch: 11, qNum: 6,
    qText: "Who is called Father of Relational Database from the following?",
    qTamil: "உறவுநிலை தரவுத்தளத்தின் தந்தை என்று அழைக்கப்படுபவர் யார்?",
    optA: "Chris Date", optB: "Hugh Darween", optC: "Edgar Frank Codd", optD: "Edgar Frank Cadd",
    ans: "C",
    exp: "Edgar Frank Codd is recognized as the Father of Relational Databases.",
    expTamil: "எட்கர் பிராங்க் காட் (Edgar Frank Codd) உறவுநிலை தரவுத்தளத்தின் தந்தை எனப்படுகிறார்."
  },
  {
    ch: 11, qNum: 7,
    qText: "Which of the following is an open-source embedded RDBMS?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது ஒரு RDBMS மென்பொருள்?",
    optA: "Dbase", optB: "Foxpro", optC: "Microsoft Access", optD: "SQLite",
    ans: "D",
    exp: "SQLite is a popular relational database management system (RDBMS).",
    expTamil: "SQLite என்பது ஒரு RDBMS ஆகும்."
  },
  {
    ch: 11, qNum: 8,
    qText: "What relational algebra symbol is used for SELECT (horizontal subsetting) operation?",
    qTamil: "SELECT செயல்பாட்டிற்கு பயன்படும் தொடர்பியல் இயற்கணித குறியீடு எது?",
    optA: "σ", optB: "Π", optC: "X", optD: "Ω",
    ans: "A",
    exp: "Lowercase sigma (σ) denotes the SELECT operator in Relational Algebra.",
    expTamil: "σ (சிக்மா) SELECT செயற்குறியைக் குறிக்கிறது."
  },
  {
    ch: 11, qNum: 9,
    qText: "In a relational table, a tuple is also known as:",
    qTamil: "அட்டவணையில் ஒரு டப்பிள் (tuple) என்பது எதனைக் குறிக்கும்?",
    optA: "table", optB: "row", optC: "attribute", optD: "field",
    ans: "B",
    exp: "A row of data in a table represents a record and is formally called a Tuple.",
    expTamil: "வரிசை (row) டப்பிள் எனப்படும்."
  },
  {
    ch: 11, qNum: 10,
    qText: "Who developed the Entity-Relationship (ER) model?",
    qTamil: "ER மாதிரியை உருவாக்கியவர் யார்?",
    optA: "Chen", optB: "EF Codd", optC: "Chend", optD: "Chand",
    ans: "A",
    exp: "Peter Chen developed the Entity-Relationship (ER) model in 1976.",
    expTamil: "பீட்டர் சென் (Peter Chen) ER மாதிரியை உருவாக்கினார்."
  },

  // CHAPTER 12
  {
    ch: 12, qNum: 1,
    qText: "Which SQL commands provide definitions for creating table structure, deleting relations, and modifying schemas?",
    qTamil: "அட்டவணை அமைப்பை உருவாக்கவும் மாற்றவும் பயன்படும் SQL கட்டளைகள் எவை?",
    optA: "DDL", optB: "DML", optC: "DCL", optD: "DQL",
    ans: "A",
    exp: "Data Definition Language (DDL) commands include CREATE, ALTER, DROP, and TRUNCATE.",
    expTamil: "DDL (Data Definition Language) அட்டவணை அமைப்பை வரையறுக்கிறது."
  },
  {
    ch: 12, qNum: 2,
    qText: "Which SQL command lets you modify the structure of an existing table?",
    qTamil: "ஏற்கனவே உள்ள அட்டவணையின் கட்டமைப்பை மாற்ற அனுமதிக்கும் கட்டளை எது?",
    optA: "SELECT", optB: "ORDER BY", optC: "MODIFY", optD: "ALTER",
    ans: "D",
    exp: "ALTER TABLE adds, deletes, or modifies columns in an existing table.",
    expTamil: "ALTER TABLE கட்டளை அட்டவணை கட்டமைப்பை மாற்றுகிறது."
  },
  {
    ch: 12, qNum: 3,
    qText: "The SQL command used to delete an entire table along with its structure is:",
    qTamil: "அட்டவணையை அதன் கட்டமைப்புடன் சேர்த்து நீக்க பயன்படும் கட்டளை எது?",
    optA: "DROP", optB: "DELETE", optC: "DELETE ALL", optD: "ALTER TABLE",
    ans: "A",
    exp: "DROP TABLE deletes the table and removes its schema from the database.",
    expTamil: "DROP கட்டளை அட்டவணையை நிரந்தரமாக நீக்குகிறது."
  },
  {
    ch: 12, qNum: 4,
    qText: "Queries to retrieve data from a database table can be generated using:",
    qTamil: "தரவுத்தளத்திலிருந்து தரவை மீட்டெடுக்க வினவல்கள் எதன் மூலம் உருவாக்கப்படுகின்றன?",
    optA: "SELECT", optB: "ORDER BY", optC: "MODIFY", optD: "ALTER",
    ans: "A",
    exp: "The SELECT statement retrieves data from one or more database tables.",
    expTamil: "SELECT கட்டளை தரவை மீட்டெடுக்க பயன்படுகிறது."
  },
  {
    ch: 12, qNum: 5,
    qText: "The SQL clause used to sort retrieved data in a database is:",
    qTamil: "தரவுத்தளத்தில் தரவை வரிசைப்படுத்த பயன்படும் SQL துணைநிலை எது?",
    optA: "SORT BY", optB: "ORDER BY", optC: "GROUP BY", optD: "SELECT",
    ans: "B",
    exp: "The ORDER BY clause sorts the query results in ascending or descending order.",
    expTamil: "ORDER BY துணைநிலை முடிவுகளை வரிசைப்படுத்துகிறது."
  },

  // CHAPTER 13
  {
    ch: 13, qNum: 1,
    qText: "A CSV file is also known as a:",
    qTamil: "CSV கோப்பு எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Flat File", optB: "3D File", optC: "String File", optD: "Random File",
    ans: "A",
    exp: "A CSV file is a plain-text tabular structure known as a Flat File.",
    expTamil: "தட்டை கோப்பு (Flat File) என அழைக்கப்படுகிறது."
  },
  {
    ch: 13, qNum: 2,
    qText: "The expansion of CRLF is:",
    qTamil: "CRLF என்பதன் விரிவாக்கம் என்ன?",
    optA: "Control Return and Line Feed", optB: "Carriage Return and Form Feed", optC: "Control Router and Line Feed", optD: "Carriage Return and Line Feed",
    ans: "D",
    exp: "CRLF stands for Carriage Return (\\r) and Line Feed (\\n).",
    expTamil: "Carriage Return and Line Feed."
  },
  {
    ch: 13, qNum: 3,
    qText: "Which of the following built-in module is provided by Python to perform operations on CSV files?",
    qTamil: "CSV கோப்புகளில் செயல்பாடுகளைச் செய்ய பைத்தான் வழங்கும் தொகுதி எது?",
    optA: "py", optB: "xls", optC: "csv", optD: "os",
    ans: "C",
    exp: "Python provides the standard 'csv' module with reader and writer classes.",
    expTamil: "csv தொகுதி CSV கோப்புகளைக் கையாளப் பயன்படுகிறது."
  },
  {
    ch: 13, qNum: 4,
    qText: "Which of the following mode is used when dealing with non-text files like images or executables?",
    qTamil: "படங்கள் போன்ற உரை அல்லாத கோப்புகளைக் கையாளும் போது எந்த முறை பயன்படுத்தப்படுகிறது?",
    optA: "Text mode", optB: "Binary mode", optC: "xls mode", optD: "csv mode",
    ans: "B",
    exp: "Binary mode ('rb', 'wb') reads/writes raw bytes without newline translation.",
    expTamil: "இருநிலை முறை (Binary mode) பயன்படுத்தப்படுகிறது."
  },
  {
    ch: 13, qNum: 5,
    qText: "The command used to skip the header row in a CSV file reader object is:",
    qTamil: "CSV கோப்பில் முதல் தலைப்பு வரிசையை தவிர்க்க பயன்படும் கட்டளை எது?",
    optA: "next()", optB: "skip()", optC: "omit()", optD: "bounce()",
    ans: "A",
    exp: "next(reader) advances the reader cursor by one row, skipping the header.",
    expTamil: "next() செயற்கூறு அடுத்த வரிசைக்கு தாவுகிறது."
  },
  {
    ch: 13, qNum: 6,
    qText: "Which of the following is a parameter string used to terminate lines produced by writer() method of csv module?",
    qTamil: "csv writer() முறை மூலம் தயாரிக்கப்படும் வரிகளை முடிக்க பயன்படும் அளவுரு எது?",
    optA: "lineterminator", optB: "Enter key", optC: "Form feed", optD: "Data Terminator",
    ans: "A",
    exp: "lineterminator defines the character sequence used to terminate rows written by csv.writer.",
    expTamil: "lineterminator வரிகளை முடிக்க பயன்படுகிறது."
  },
  {
    ch: 13, qNum: 7,
    qText: "When reading a CSV with next(d) and iterating over remaining rows, what is skipped?",
    qTamil: "next(d) பயன்படுத்தும் போது என்ன வரி தவிர்க்கப்படுகிறது?",
    optA: "Last row", optB: "First row (header)", optC: "All rows", optD: "Middle row",
    ans: "B",
    exp: "Calling next() on a reader consumes the first row (the column header).",
    expTamil: "முதல் தலைப்பு வரிசை தவிர்க்கப்படுகிறது."
  },
  {
    ch: 13, qNum: 8,
    qText: "Which of the following creates an object which maps CSV data to a dictionary?",
    qTamil: "CSV தரவை அகராதிக்கு (dictionary) வரைபடமாக்கும் பொருளை உருவாக்குவது எது?",
    optA: "listreader()", optB: "reader()", optC: "tuplereader()", optD: "DictReader()",
    ans: "D",
    exp: "csv.DictReader() reads rows into ordered dictionaries mapping column headers to values.",
    expTamil: "DictReader() அகராதி வடிவில் தரவை படிக்கிறது."
  },
  {
    ch: 13, qNum: 9,
    qText: "Adding more data at the end of an existing file in Python is called:",
    qTamil: "ஏற்கனவே உள்ள கோப்பின் இறுதியில் கூடுதல் தரவை சேர்ப்பது எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "Editing", optB: "Appending", optC: "Modification", optD: "Alteration",
    ans: "B",
    exp: "Opening a file in 'a' mode to write new content without truncating is called Appending.",
    expTamil: "சேர்த்தல் (Appending) எனப்படும்."
  },
  {
    ch: 13, qNum: 10,
    qText: "In Python csv.writer, which method is used to write all rows from a 2D list at once?",
    qTamil: "ஒரே நேரத்தில் பல வரிசைகளை எழுத உதவும் முறை எது?",
    optA: "writerows()", optB: "writeall()", optC: "write()", optD: "appendrows()",
    ans: "A",
    exp: "writerows() writes all the given sequence of row elements to the CSV file.",
    expTamil: "writerows() பல வரிசைகளை ஒரே நேரத்தில் எழுதுகிறது."
  },

  // CHAPTER 14
  {
    ch: 14, qNum: 1,
    qText: "Which of the following is not a scripting language?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது ஸ்கிரிப்டிங் மொழி அல்ல?",
    optA: "JavaScript", optB: "PHP", optC: "Perl", optD: "HTML",
    ans: "D",
    exp: "HTML is a HyperText Markup Language, not a scripting language.",
    expTamil: "HTML என்பது ஒரு மார்க்அப் மொழி, ஸ்கிரிப்டிங் மொழி அல்ல."
  },
  {
    ch: 14, qNum: 2,
    qText: "Importing C++ program in a Python program is called:",
    qTamil: "பைத்தான் நிரலில் சி++ நிரலை தருவிப்பது எவ்வாறு அழைக்கப்படுகிறது?",
    optA: "wrapping", optB: "Downloading", optC: "Interconnecting", optD: "Parsing",
    ans: "A",
    exp: "Wrapping provides a bridge or interface so Python can execute compiled C++ code.",
    expTamil: "ரேப்பிங் (wrapping) எனப்படும்."
  },
  {
    ch: 14, qNum: 3,
    qText: "The expansion of API is:",
    qTamil: "API என்பதன் விரிவாக்கம் என்ன?",
    optA: "Application Programming Interpreter", optB: "Application Programming Interface", optC: "Application Performing Interface", optD: "Application Programming Interlink",
    ans: "B",
    exp: "API stands for Application Programming Interface.",
    expTamil: "Application Programming Interface."
  },
  {
    ch: 14, qNum: 4,
    qText: "A popular C++ library framework for interfacing Python and C++ is:",
    qTamil: "பைத்தான் மற்றும் சி++ ஐ இணைப்பதற்கான கட்டமைப்பு எது?",
    optA: "Ctypes", optB: "SWIG", optC: "Cython", optD: "Boost",
    ans: "D",
    exp: "Boost.Python is a dedicated C++ library used to interface Python and C++ smoothly.",
    expTamil: "Boost கட்டமைப்பு பைத்தான் மற்றும் சி++ ஐ இணைக்க பயன்படுகிறது."
  },
  {
    ch: 14, qNum: 5,
    qText: "Which software design technique splits code into separate, independent subprograms?",
    qTamil: "குறிமுறையை தனித்தனி பகுதிகளாகப் பிரிக்கும் வடிவமைப்பு நுட்பம் எது?",
    optA: "Object oriented Programming", optB: "Modular programming", optC: "Low Level Programming", optD: "Procedure oriented Programming",
    ans: "B",
    exp: "Modular programming decomposes a large program into discrete, reusable modules.",
    expTamil: "கூறுநிலை நிரலாக்கம் (Modular programming) ஆகும்."
  },
  {
    ch: 14, qNum: 6,
    qText: "The module which allows you to interface with the operating system in Python is:",
    qTamil: "இயக்க முறைமையுடன் தொடர்பு கொள்ள அனுமதிக்கும் பைத்தான் தொகுதி எது?",
    optA: "os module", optB: "sys module", optC: "csv module", optD: "getopt module",
    ans: "A",
    exp: "The 'os' module provides a portable way of using operating system dependent functionality.",
    expTamil: "os தொகுதி இயக்க முறைமையுடன் தொடர்பு கொள்ள உதவுகிறது."
  },
  {
    ch: 14, qNum: 7,
    qText: "In getopt.getopt(), which variable receives the arguments list if command-line parsing succeeds?",
    qTamil: "getopt() கட்டளை வரி செயலுருபுகளை பிரித்து எதில் வழங்குகிறது?",
    optA: "argv variable", optB: "opt variable", optC: "args variable", optD: "ifile variable",
    ans: "C",
    exp: "getopt returns a pair: (opts, args), where args contains the remaining positional arguments.",
    expTamil: "args மாறி செயலுருபுகளைக் கொண்டிருக்கும்."
  },
  {
    ch: 14, qNum: 8,
    qText: "Identify the function call statement in: if __name__ == '__main__': main(sys.argv[1:])",
    qTamil: "if __name__ == '__main__': main(sys.argv[1:]) - இதில் செயற்கூறு அழைப்பு கூற்று எது?",
    optA: "main(sys.argv[1:])", optB: "__name__", optC: "__main__", optD: "argv",
    ans: "A",
    exp: "main(sys.argv[1:]) is the function call invocation passing slice arguments.",
    expTamil: "main(sys.argv[1:]) என்பது செயற்கூறு அழைப்பு ஆகும்."
  },
  {
    ch: 14, qNum: 9,
    qText: "Which high-level language can be used easily for processing text, numbers, images, and scientific data?",
    qTamil: "உரை, எண்கள், படங்கள் மற்றும் அறிவியல் தரவை செயலாக்க பயன்படும் மொழி எது?",
    optA: "HTML", optB: "C", optC: "C++", optD: "PYTHON",
    ans: "D",
    exp: "Python provides comprehensive libraries for scientific data, text, and computer vision.",
    expTamil: "பைத்தான் (PYTHON) அனைத்து வகை தரவுகளையும் எளிதாக செயலாக்குகிறது."
  },
  {
    ch: 14, qNum: 10,
    qText: "When a Python file is run directly from the command prompt, what does the special variable __name__ contain?",
    qTamil: "ஒரு பைத்தான் கோப்பு நேரடியாக இயக்கப்படும் போது __name__ மாறியின் மதிப்பு என்ன?",
    optA: "c++ filename", optB: "__main__", optC: "python filename", optD: "os module name",
    ans: "B",
    exp: "When a module is run as the entry script, Python sets __name__ = '__main__'.",
    expTamil: "__main__ மதிப்பைக் கொண்டிருக்கும்."
  },

  // CHAPTER 15
  {
    ch: 15, qNum: 1,
    qText: "Which of the following is an organized collection of data?",
    qTamil: "கீழ்க்கண்டவற்றுள் எது முறைப்படுத்தப்பட்ட தரவுகளின் தொகுப்பு?",
    optA: "Database", optB: "DBMS", optC: "Information", optD: "Records",
    ans: "A",
    exp: "A database is an organized collection of structured data or information.",
    expTamil: "தரவுத்தளம் (Database) என்பது முறைப்படுத்தப்பட்ட தரவுகளின் தொகுப்பாகும்."
  },
  {
    ch: 15, qNum: 2,
    qText: "SQLite falls under which database system?",
    qTamil: "SQLite எந்த தரவுத்தள அமைப்பின் கீழ் வருகிறது?",
    optA: "Flat file database system", optB: "Relational Database system", optC: "Hierarchical database system", optD: "Object oriented Database system",
    ans: "B",
    exp: "SQLite is a C-language library that implements a small, fast, self-contained Relational Database Management System (RDBMS).",
    expTamil: "உறவுநிலை தரவுத்தள அமைப்பு (Relational Database system) ஆகும்."
  },
  {
    ch: 15, qNum: 3,
    qText: "Which of the following is a control structure used to traverse and fetch records from a database query in Python?",
    qTamil: "தரவுத்தள பதிவுகளை உலாவவும் பெறவும் பயன்படும் கட்டுப்பாட்டு அமைப்பு எது?",
    optA: "Pointer", optB: "Key", optC: "Cursor", optD: "Insertion point",
    ans: "C",
    exp: "A Cursor object is used to execute SQL queries and iterate over result rows.",
    expTamil: "கர்சர் (Cursor) பதிவுகளை மீட்டெடுக்க பயன்படுகிறது."
  },
  {
    ch: 15, qNum: 4,
    qText: "Any changes made to the records in SQLite via Python must be permanently saved to disk using:",
    qTamil: "தரவுத்தளத்தில் செய்யப்பட்ட மாற்றங்களை நிரந்தரமாக சேமிக்க பயன்படும் கட்டளை எது?",
    optA: "Save", optB: "Save As", optC: "commit()", optD: "Oblige",
    ans: "C",
    exp: "connection.commit() saves all pending transactions to the SQLite database file.",
    expTamil: "commit() கட்டளை மாற்றங்களை நிரந்தரமாக சேமிக்கிறது."
  },
  {
    ch: 15, qNum: 5,
    qText: "Which cursor method executes an SQL command in Python SQLite?",
    qTamil: "SQL கட்டளையை இயக்க பயன்படும் முறை எது?",
    optA: "execute()", optB: "key()", optC: "cursor()", optD: "run()",
    ans: "A",
    exp: "cursor.execute(sql_query) executes an SQL statement.",
    expTamil: "execute() முறை SQL கட்டளையை இயக்குகிறது."
  },
  {
    ch: 15, qNum: 6,
    qText: "Which SQL aggregate function retrieves the average of a selected numeric column?",
    qTamil: "தேர்ந்தெடுக்கப்பட்ட நெடுவரிசையின் சராசரியைப் பெற உதவும் சார்பு எது?",
    optA: "Add()", optB: "SUM()", optC: "AVG()", optD: "AVERAGE()",
    ans: "C",
    exp: "AVG() computes the mathematical mean of a column.",
    expTamil: "AVG() சராசரியைக் கணக்கிடுகிறது."
  },
  {
    ch: 15, qNum: 7,
    qText: "The SQL function that returns the largest value of the selected column is:",
    qTamil: "நெடுவரிசையின் மிகப்பெரிய மதிப்பைத் தரும் சார்பு எது?",
    optA: "MAX()", optB: "LARGE()", optC: "HIGH()", optD: "MAXIMUM()",
    ans: "A",
    exp: "MAX() returns the maximum value in a column.",
    expTamil: "MAX() மிகப்பெரிய மதிப்பைத் தருகிறது."
  },
  {
    ch: 15, qNum: 8,
    qText: "Which of the following internal schema table is called the master table in SQLite?",
    qTamil: "SQLite-ல் முதன்மை அட்டவணை (master table) எது?",
    optA: "sqlite_master", optB: "sql_master", optC: "main_master", optD: "master_main",
    ans: "A",
    exp: "sqlite_master holds the complete schema metadata for the database.",
    expTamil: "sqlite_master முதன்மை அட்டவணை ஆகும்."
  },
  {
    ch: 15, qNum: 9,
    qText: "The most commonly used statement in SQL to query data is:",
    qTamil: "SQL-ல் தரவை வினவ பொதுவாகப் பயன்படும் கூற்று எது?",
    optA: "cursor", optB: "SELECT", optC: "execute", optD: "commit",
    ans: "B",
    exp: "SELECT is the fundamental DQL statement in SQL.",
    expTamil: "SELECT கூற்று அதிகம் பயன்படுகிறது."
  },
  {
    ch: 15, qNum: 10,
    qText: "Which of the following clause eliminates duplicate rows from a query result?",
    qTamil: "நகல் வரிசைகளை அகற்ற பயன்படும் SQL துணைநிலை எது?",
    optA: "DISTINCT", optB: "Remove", optC: "Where", optD: "GroupBy",
    ans: "A",
    exp: "SELECT DISTINCT removes duplicate records from the returned dataset.",
    expTamil: "DISTINCT நகல்களை நீக்குகிறது."
  },

  // CHAPTER 16
  {
    ch: 16, qNum: 1,
    qText: "Which is a Python library module used for 2D graphics and data visualization?",
    qTamil: "2D கிராபிக்ஸ் மற்றும் தரவு காட்சிப்படுத்தலுக்கு பயன்படும் பைத்தான் தொகுதி எது?",
    optA: "matplotlib.pyplot", optB: "matplotlib.pip", optC: "matplotlib.numpy", optD: "matplotlib.plt",
    ans: "A",
    exp: "matplotlib.pyplot is the plotting interface collection in Matplotlib.",
    expTamil: "matplotlib.pyplot தரவை காட்சிப்படுத்த பயன்படுகிறது."
  },
  {
    ch: 16, qNum: 2,
    qText: "Identify the standard package manager for Python packages and modules:",
    qTamil: "பைத்தான் தொகுப்புகளுக்கான நிலையான தொகுப்பு மேலாளர் எது?",
    optA: "Matplotlib", optB: "PIP", optC: "plt.show()", optD: "python package",
    ans: "B",
    exp: "pip is the package installer for Python.",
    expTamil: "PIP என்பது பைத்தான் தொகுப்பு மேலாளர் ஆகும்."
  },
  {
    ch: 16, qNum: 3,
    qText: "What is the purpose of the command: pip --version ?",
    qTamil: "pip --version கட்டளையின் பயன் என்ன?",
    optA: "Check if PIP is Installed", optB: "Install PIP", optC: "Download a Package", optD: "Check PIP version",
    ans: "D",
    exp: "pip --version checks and displays the currently installed pip release version.",
    expTamil: "PIP-ன் பதிப்பை சரிபார்க்க பயன்படுகிறது."
  },
  {
    ch: 16, qNum: 4,
    qText: "What is the purpose of the command: pip list ?",
    qTamil: "pip list கட்டளையின் பயன் என்ன?",
    optA: "List installed packages", optB: "list command", optC: "Install PIP", optD: "packages installed",
    ans: "A",
    exp: "pip list displays a table of all Python libraries currently installed in the environment.",
    expTamil: "நிறுவப்பட்ட அனைத்து தொகுப்புகளையும் பட்டியலிடுகிறது."
  },
  {
    ch: 16, qNum: 5,
    qText: "In the command 'python -m pip install -U pip', what does '-U' represent?",
    qTamil: "'python -m pip install -U pip' என்பதில் '-U' எதனைக் குறிக்கிறது?",
    optA: "downloading pip to the latest version", optB: "upgrading pip to the latest version", optC: "removing pip", optD: "upgrading matplotlib to the latest version",
    ans: "B",
    exp: "The -U flag stands for --upgrade, ensuring pip updates to the latest release.",
    expTamil: "-U என்பது புதிய பதிப்பிற்கு மேம்படுத்துவதைக் குறிக்கிறது (upgrade)."
  },
  {
    ch: 16, qNum: 6,
    qText: "Which Matplotlib script generates a line chart passing through points (1,4), (2,5), (3,1)?",
    qTamil: "(1,4), (2,5), (3,1) புள்ளிகளை இணைத்து கோட்டு விளக்கப்படம் வரையும் குறிமுறை எது?",
    optA: "import matplotlib.pyplot as plt; plt.plot([1,2,3],[4,5,1]); plt.show()",
    optB: "import matplotlib.pyplot as plt; plt.plot([1,2],[4,5]); plt.show()",
    optC: "import matplotlib.pyplot as plt; plt.plot([2,3],[5,1]); plt.show()",
    optD: "import matplotlib.pyplot as plt; plt.plot([1,3],[4,1]); plt.show()",
    ans: "A",
    exp: "plt.plot(x, y) with x=[1,2,3] and y=[4,5,1] plots the specified line segment sequence.",
    expTamil: "plt.plot([1,2,3],[4,5,1]) சரியான புள்ளிகளை வரைகிறது."
  },
  {
    ch: 16, qNum: 7,
    qText: "In Matplotlib, what does plt.plot(3, 2) plot?",
    qTamil: "plt.plot(3, 2) என்ன வெளியீட்டை தரும்?",
    optA: "Line chart", optB: "A point / single point plot", optC: "Bar chart", optD: "Pie chart",
    ans: "B",
    exp: "plt.plot(x, y) with scalar arguments plots a single point in Cartesian coordinates.",
    expTamil: "ஒற்றைப் புள்ளியை (3,2) குறிக்கும்."
  },
  {
    ch: 16, qNum: 8,
    qText: "Which function key is used to run a Python module in the IDLE editor?",
    qTamil: "IDLE எடிட்டரில் பைத்தான் நிரலை இயக்க பயன்படும் விசை எது?",
    optA: "F6", optB: "F4", optC: "F3", optD: "F5",
    ans: "D",
    exp: "Pressing F5 runs the active module in Python IDLE.",
    expTamil: "F5 விசை நிரலை இயக்க பயன்படுகிறது."
  },
  {
    ch: 16, qNum: 9,
    qText: "Identify the chart type used to visualize trends over intervals of time with lines drawn chronologically:",
    qTamil: "காலப்போக்கில் ஏற்படும் மாற்றங்களை வரிசையாக இணைத்து காட்டும் விளக்கப்படம் எது?",
    optA: "Line chart", optB: "Bar chart", optC: "Pie chart", optD: "Scatter plot",
    ans: "A",
    exp: "A Line chart displays information as a series of data points called 'markers' connected by straight lines.",
    expTamil: "கோட்டு விளக்கப்படம் (Line chart) காலப் போக்கைக் காட்டுகிறது."
  },
  {
    ch: 16, qNum: 10,
    qText: "Statement A: plt.pie() creates a pie chart. Statement B: autopct displays percentage values formatted.",
    qTamil: "கூற்று A: plt.pie() வட்ட விளக்கப்படத்தை உருவாக்குகிறது. கூற்று B: autopct சதவீத மதிப்பை வடிவமைத்து காட்டுகிறது.",
    optA: "Statement A is correct", optB: "Statement B is correct", optC: "Both statements are correct", optD: "Both statements are wrong",
    ans: "C",
    exp: "plt.pie() renders the pie wedges, and the autopct parameter formats the slice percentage labels.",
    expTamil: "இரண்டு கூற்றுகளும் சரியானவை (Both statements are correct)."
  }
];

const csCode = `import type { Question } from "@/types";

export const CS_QUESTIONS: Question[] = [
${rawQuestions.map(q => `  {
    id: "q-cs-${q.ch * 100 + q.qNum}",
    chapterId: "cs-ch-${q.ch}",
    subjectId: "sub-cs",
    stream: "Computer Science",
    sourceType: "Book-In",
    status: "Teacher Review",
    difficulty: "${q.qNum % 3 === 0 ? "Hard" : q.qNum % 2 === 0 ? "Medium" : "Easy"}",
    sourceTextbookId: "12-computer-science-english-37bdae5b",
    sourcePage: ${10 + q.ch * 15},
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

writeFileSync("src/lib/data/questions/cs.ts", csCode);
console.log(`Successfully generated CS dataset with ${rawQuestions.length} questions.`);
