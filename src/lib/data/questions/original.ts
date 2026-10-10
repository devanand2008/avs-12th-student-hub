import type { Question } from "@/types";

export const ORIGINAL_PRACTICE_QUESTIONS: Question[] = [
  // --- COMPUTER SCIENCE: Chapter 1 ---
  {
    id: "q-cs-101",
    chapterId: "cs-ch-1",
    questionText:
      "The small sections of code that are used to perform a particular task is called:",
    questionTextTamil:
      "ஒரு குறிப்பிட்ட செயலை செய்வதற்காகப் பயன்படும் குறிமுறையின் சிறிய பகுதி:",
    optionA: "Subroutines",
    optionB: "Files",
    optionC: "Pseudo-code",
    optionD: "Modules",
    correctAnswer: "A",
    explanation:
      "Subroutines are basic building blocks of computer programs. In programming languages, subroutines are known as Functions.",
    explanationTamil:
      "துணை நிரல்கள் (Subroutines) என்பது கணினி நிரல்களின் அடிப்படை கட்டுமானத் தொகுதிகள் ஆகும்.",
    difficulty: "Easy",
    sourceType: "Book-In",
    status: "Published",
    stream: "Computer Science",
    subjectId: "sub-cs",
    createdAt: "2026-09-01",
  },
  {
    id: "q-cs-102",
    chapterId: "cs-ch-1",
    questionText:
      "Which of the following functions does not cause any side effect with respect to its arguments?",
    questionTextTamil:
      "கீழ்க்கண்டவற்றுள் எந்த செயற்கூறு அதன் செயலுருபுகளில் எந்த பக்கவிளைவுகளையும் ஏற்படுத்தாது?",
    optionA: "Impure function",
    optionB: "Pure function",
    optionC: "Dynamic function",
    optionD: "Recursive function",
    correctAnswer: "B",
    explanation:
      "Pure functions always evaluate to the same result given the same arguments and do not cause side effects on variables outside their scope.",
    explanationTamil:
      "தூய செயற்கூறுகள் (Pure functions) அதே உள்ளீடுகளுக்கு எப்போதும் ஒரே முடிவைத் தரும் மற்றும் பக்கவிளைவுகள் அற்றவை.",
    difficulty: "Easy",
    sourceType: "Book-In",
    status: "Published",
    stream: "Computer Science",
    subjectId: "sub-cs",
    createdAt: "2026-09-01",
  },
  {
    id: "q-cs-103",
    chapterId: "cs-ch-1",
    questionText:
      "Consider the function: let rec gcd a b := if b = 0 then a else gcd b (a mod b). What type of function is this?",
    questionTextTamil:
      "let rec gcd a b := if b = 0 then a else gcd b (a mod b) - இந்த செயற்கூறு எவ்வகை செயற்கூறு?",
    optionA: "Impure recursive function",
    optionB: "Pure recursive function",
    optionC: "Non-terminating loop",
    optionD: "Built-in impure function",
    correctAnswer: "B",
    explanation:
      "gcd computes the greatest common divisor purely mathematically using recursion without mutating any external state or global variable, making it a pure recursive function.",
    explanationTamil:
      "gcd செயற்கூறு எந்த வெளிப்புற மாறியையும் மாற்றாமல் தற்சுழற்சியாக கணிப்பதால் இது தூய தற்சுழற்சி செயற்கூறு ஆகும்.",
    difficulty: "Medium",
    sourceType: "Book-Out",
    status: "Published",
    stream: "Computer Science",
    subjectId: "sub-cs",
    createdAt: "2026-09-02",
  },
  {
    id: "q-cs-104",
    chapterId: "cs-ch-1",
    questionText:
      "In the function definition 'let add (a: int) (b: int) : int', what do 'a' and 'b' represent?",
    questionTextTamil:
      "'let add (a: int) (b: int) : int' என்ற செயற்கூறு வரையறையில் 'a' மற்றும் 'b' எவற்றைக் குறிக்கின்றன?",
    optionA: "Arguments",
    optionB: "Parameters",
    optionC: "Return types",
    optionD: "Subroutines",
    correctAnswer: "B",
    explanation:
      "Variables in a function definition are called Parameters. Values passed to a function call are called Arguments.",
    explanationTamil:
      "செயற்கூறு வரையறையில் உள்ள மாறிகள் அளபுருக்கள் (Parameters) எனப்படும்.",
    difficulty: "Easy",
    sourceType: "Book-In",
    status: "Published",
    stream: "Computer Science",
    subjectId: "sub-cs",
    createdAt: "2026-09-02",
  },
  {
    id: "q-cs-105",
    chapterId: "cs-ch-1",
    questionText:
      "Which property allows the compiler to replace a pure function call with its returned value without altering program behavior?",
    questionTextTamil:
      "நிரலின் செயல்பாட்டை மாற்றாமல் தூய செயற்கூறு அழைப்பை அதன் விடையால் மாற்றியமைக்கும் பண்பு எது?",
    optionA: "Data Abstraction",
    optionB: "Dynamic Binding",
    optionC: "Referential Transparency",
    optionD: "Operator Overloading",
    correctAnswer: "C",
    explanation:
      "Referential transparency means an expression or function call can be replaced with its corresponding value without changing the program's result.",
    explanationTamil:
      "சுட்டுநோக்கு ஒளிவுமறைவின்மை (Referential Transparency) என்பது செயற்கூறு அழைப்பை அதன் மதிப்பால் மாற்றியமைக்க அனுமதிக்கும்.",
    difficulty: "Hard",
    sourceType: "Book-Out",
    status: "Published",
    stream: "Computer Science",
    subjectId: "sub-cs",
    createdAt: "2026-09-03",
  },

  // --- COMPUTER SCIENCE: Chapter 7 (Python Functions) ---
  {
    id: "q-cs-701",
    chapterId: "cs-ch-7",
    questionText:
      "Which keyword is used to define an anonymous or inline function in Python?",
    questionTextTamil:
      "பைத்தானில் பெயரற்ற அல்லது வரிசைக்குள் உள்ள செயற்கூறை வரையறுக்கப் பயன்படும் சிறப்புச்சொல் எது?",
    optionA: "def",
    optionB: "inline",
    optionC: "lambda",
    optionD: "func",
    correctAnswer: "C",
    explanation:
      "In Python, anonymous functions are defined using the 'lambda' keyword, whereas regular functions are defined using 'def'.",
    explanationTamil:
      "பைத்தானில் பெயரற்ற செயற்கூறுகள் 'lambda' சிறப்புச்சொல் மூலம் வரையறுக்கப்படுகின்றன.",
    difficulty: "Easy",
    sourceType: "Book-In",
    status: "Published",
    stream: "Computer Science",
    subjectId: "sub-cs",
    createdAt: "2026-09-05",
  },
  {
    id: "q-cs-702",
    chapterId: "cs-ch-7",
    questionText:
      "What is the output of the following code? `f = lambda a, b: a if a > b else b; print(f(12, 25))`",
    questionTextTamil:
      "`f = lambda a, b: a if a > b else b; print(f(12, 25))` என்ற குறிமுறையின் வெளியீடு என்ன?",
    optionA: "12",
    optionB: "25",
    optionC: "True",
    optionD: "SyntaxError",
    correctAnswer: "B",
    explanation:
      "The lambda evaluates the ternary condition. Since 12 > 25 is False, it returns 'b' which is 25.",
    explanationTamil:
      "12 > 25 என்பது தவறு என்பதால், அது 'b'-ன் மதிப்பான 25-ஐ வழங்கும்.",
    difficulty: "Medium",
    sourceType: "Book-Out",
    status: "Published",
    stream: "Computer Science",
    subjectId: "sub-cs",
    createdAt: "2026-09-05",
  },
  {
    id: "q-cs-703",
    chapterId: "cs-ch-7",
    questionText:
      "In Python, which symbol is used to pass variable-length non-keyword arguments to a function?",
    questionTextTamil:
      "பைத்தானில் மாறக்கூடிய நீளமுடைய செயலுருபுகளை அனுப்பப் பயன்படும் குறியீடு எது?",
    optionA: "&",
    optionB: "#",
    optionC: "*",
    optionD: "**",
    correctAnswer: "C",
    explanation:
      "*args is used for non-keyword variable-length arguments (tuple), while **kwargs is used for keyword variable-length arguments (dictionary).",
    explanationTamil:
      "* குறியீடு மாறக்கூடிய நீளமுடைய செயலுருபுகளை அனுப்பப் பயன்படுகிறது.",
    difficulty: "Medium",
    sourceType: "Book-In",
    status: "Published",
    stream: "Computer Science",
    subjectId: "sub-cs",
    createdAt: "2026-09-06",
  },

  // --- BIO-BOTANY: Chapter 1 ---
  {
    id: "q-bot-101",
    chapterId: "bot-ch-1",
    questionText:
      "Which wall layer of the microsporangium provides nourishment to the developing pollen grains?",
    questionTextTamil:
      "வளரும் மகரந்த துகள்களுக்கு ஊட்டமளிக்கும் மகரந்தப்பையின் சுவர் அடுக்கு எது?",
    optionA: "Epidermis",
    optionB: "Endothecium",
    optionC: "Middle layers",
    optionD: "Tapetum",
    correctAnswer: "D",
    explanation:
      "Tapetum is the innermost layer of the anther wall and supplies nutrition to the developing pollen grains.",
    explanationTamil:
      "டேப்பிட்டம் (Tapetum) என்பது மகரந்தப்பையின் உள் அடுக்காகும், இது வளரும் மகரந்த துகள்களுக்கு ஊட்டமளிக்கிறது.",
    difficulty: "Easy",
    sourceType: "Book-In",
    status: "Published",
    stream: "Biology",
    subjectId: "sub-botany",
    createdAt: "2026-09-07",
  },
  {
    id: "bot-102",
    chapterId: "bot-ch-1",
    questionText:
      "The fibrous bands in the endothecium layer of anther are chemically composed of:",
    questionTextTamil:
      "மகரந்தப்பையின் எண்டோதீசியம் அடுக்கில் உள்ள நார்ப்பட்டைகள் எதனால் ஆனவை?",
    optionA: "Pectin",
    optionB: "Alpha-Cellulose",
    optionC: "Sporopollenin",
    optionD: "Suberin",
    correctAnswer: "B",
    explanation:
      "The radial walls of endothecium cells develop fibrous thickenings made of alpha-cellulose which aid in anther dehiscence.",
    explanationTamil:
      "எண்டோதீசியம் செல்களின் ஆரச் சுவர்கள் ஆல்ஃபா-செல்லுலோஸால் ஆன நார்ப்பட்டைகளைக் கொண்டுள்ளன.",
    difficulty: "Hard",
    sourceType: "Book-Out",
    status: "Published",
    stream: "Biology",
    subjectId: "sub-botany",
    createdAt: "2026-09-07",
  },
  {
    id: "bot-103",
    chapterId: "bot-ch-1",
    questionText:
      "In angiosperms, the functional female gametophyte (embryo sac) at maturity is typically:",
    questionTextTamil:
      "மூடுவிதை தாவரங்களில் முதிர்ந்த கருப்பை (பெண் கேமிட்டோபைட்) என்பது பொதுவாக:",
    optionA: "8-celled and 8-nucleate",
    optionB: "7-celled and 7-nucleate",
    optionC: "7-celled and 8-nucleate",
    optionD: "8-celled and 7-nucleate",
    correctAnswer: "C",
    explanation:
      "A typical mature angiosperm embryo sac contains 7 cells (3 antipodals, 2 synergids, 1 egg cell, and 1 large central cell with 2 polar nuclei), hence 7-celled and 8-nucleate.",
    explanationTamil:
      "முதிர்ந்த கருப்பை 7 செல்கள் மற்றும் 8 உட்கருக்களைக் கொண்டுள்ளது.",
    difficulty: "Medium",
    sourceType: "Book-In",
    status: "Published",
    stream: "Biology",
    subjectId: "sub-botany",
    createdAt: "2026-09-08",
  },

  // --- BIO-ZOOLOGY: Chapter 2 ---
  {
    id: "q-zoo-201",
    chapterId: "zoo-ch-2",
    questionText:
      "The surge of which pituitary hormone induces ovulation and rupture of the Graafian follicle?",
    questionTextTamil:
      "கிராஃபியன் பாலிக்கிள் வெடித்து அண்டம் விடுபட (அண்டவெளியீடு) காரணமான பிட்யூட்டரி ஹார்மோன் எது?",
    optionA: "FSH",
    optionB: "LH (Luteinizing Hormone)",
    optionC: "Progesterone",
    optionD: "Prolactin",
    correctAnswer: "B",
    explanation:
      "A rapid secretion of LH leading to maximum level around the mid-cycle (called LH surge) induces rupture of Graafian follicle and release of ovum (ovulation).",
    explanationTamil:
      "LH எழுச்சி (LH surge) கிராஃபியன் பாலிக்கிளை உடைத்து அண்டவெளியீட்டைத் தூண்டுகிறது.",
    difficulty: "Easy",
    sourceType: "Book-In",
    status: "Published",
    stream: "Biology",
    subjectId: "sub-zoology",
    createdAt: "2026-09-08",
  },
  {
    id: "q-zoo-202",
    chapterId: "zoo-ch-2",
    questionText:
      "Which cells in the human testes provide nutritional support to developing spermatozoa and secrete inhibin?",
    questionTextTamil:
      "மனித விந்தகத்தில் வளரும் விந்தணுக்களுக்கு ஊட்டமளித்து இன்ஹிபினை சுரக்கும் செல்கள் எவை?",
    optionA: "Leydig cells",
    optionB: "Sertoli cells",
    optionC: "Spermatogonia",
    optionD: "Acroblasts",
    correctAnswer: "B",
    explanation:
      "Sertoli cells (also known as nurse cells) provide nourishment to developing sperm cells and secrete inhibin to regulate FSH.",
    explanationTamil:
      "செர்டோலி செல்கள் (செவிலி செல்கள்) வளரும் விந்தணுக்களுக்கு ஊட்டமளிக்கின்றன.",
    difficulty: "Medium",
    sourceType: "Book-In",
    status: "Published",
    stream: "Biology",
    subjectId: "sub-zoology",
    createdAt: "2026-09-09",
  },
  {
    id: "q-zoo-203",
    chapterId: "zoo-ch-2",
    questionText:
      "What is the primary function of the acrosome of a mature human spermatozoon?",
    questionTextTamil:
      "முதிர்ந்த மனித விந்தணுவின் அக்ரோசோமின் முதன்மை செயல்பாடு என்ன?",
    optionA: "ATP generation for motility",
    optionB: "Enzymatic penetration of corona radiata and zona pellucida",
    optionC: "DNA packaging and storage",
    optionD: "Forming the flagellar axoneme",
    correctAnswer: "B",
    explanation:
      "The acrosome is filled with hydrolytic enzymes (hyaluronidase and acrosin) that dissolve the egg membranes to allow fertilization.",
    explanationTamil:
      "அக்ரோசோம் ஹையலுரோனிடேஸ் போன்ற நொதிகளைக் கொண்டு அண்ட உறைகளைத் துளைக்க உதவுகிறது.",
    difficulty: "Hard",
    sourceType: "Book-Out",
    status: "Published",
    stream: "Biology",
    subjectId: "sub-zoology",
    createdAt: "2026-09-09",
  },
];
