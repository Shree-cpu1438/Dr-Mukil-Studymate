/**
 * Generates study notes for a given topic using smart mock data.
 * No API key required. Returns realistic, topic-aware content.
 *
 * @param topic - The study topic entered by the user
 * @param level - The study level: 'Beginner', 'Intermediate', or 'Advanced'
 * @returns A promise resolving to formatted study notes text
 */
export async function generateNotes(
  topic: string,
  level: 'Beginner' | 'Intermediate' | 'Advanced'
): Promise<string> {
  // Simulate a realistic network delay (1–2 seconds)
  await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

  const t = topic.trim();
  const levelNote =
    level === 'Beginner'
      ? 'using simple, everyday language'
      : level === 'Intermediate'
      ? 'using subject-specific terminology'
      : 'with technical depth and assumed prior knowledge';

  return `## 1. Simple Explanation

${t} is a fundamental concept studied in science, mathematics, and many other disciplines. ${levelNote.charAt(0).toUpperCase() + levelNote.slice(1)}, ${t} can be understood as a system or process where specific inputs lead to predictable outputs based on well-established principles. At the ${level} level, the most important thing to grasp is how the core idea connects to real-world applications and why it matters in its field of study.

In essence, ${t} provides a framework for understanding how things work, why certain phenomena occur, and how we can use that knowledge to solve problems, make predictions, or design new solutions. It is a building block for more advanced topics in its domain.

---

## 2. Key Points

- ${t} is a core concept that underpins many related topics in its field.
- It involves a set of rules, properties, or processes that remain consistent under defined conditions.
- Understanding ${t} at the ${level} level requires familiarity with its basic definitions and real-world relevance.
- ${t} can be applied to solve practical problems and explain observable phenomena.
- There are common misconceptions about ${t} that are important to address early.
- Mastery of ${t} opens the door to studying more complex and advanced subjects.
- The historical development of ${t} shows how human understanding has evolved over time.
- Experiments and observations have repeatedly confirmed the principles of ${t}.

---

## 3. Important Definitions

**${t}**: The central concept being studied — a principle, process, or system with defined characteristics and predictable behaviour under specific conditions.

**Principle**: A fundamental truth or rule that forms the basis of ${t} and guides how it is applied in practice.

**Variable**: A factor or quantity that can change within the context of ${t}, affecting the outcome or result of a process.

**Application**: A practical use of ${t} in a real-world scenario, such as in engineering, medicine, computing, or everyday life.

**Theory**: A well-substantiated explanation of ${t} that has been repeatedly tested and supported by evidence.

**Model**: A simplified representation of ${t} used to make predictions or explain complex behaviour in an accessible way.

---

## 4. Three Quiz Questions with Answers

**Question 1:** What is the primary purpose of studying ${t}?

**Answer:** The primary purpose is to understand the underlying principles that govern how ${t} works, enabling us to explain phenomena, make accurate predictions, and apply the knowledge to solve real-world problems.

---

**Question 2:** How does the study level affect how ${t} is approached?

**Answer:** At the Beginner level, ${t} is introduced using simple language and basic examples. At the Intermediate level, subject-specific terminology and deeper analysis are used. At the Advanced level, the study involves technical detail, complex applications, and connections to related concepts.

---

**Question 3:** Give one real-world example where ${t} is applied.

**Answer:** ${t} is applied in many real-world contexts — for example, in designing technology, understanding natural processes, solving engineering problems, or informing scientific research. The specific application depends on the field in which ${t} is studied.

---

## 5. Quick Revision Summary

${t} is a key concept that is essential for building a strong foundation in its subject area. It is governed by consistent principles that can be observed, tested, and applied across a wide range of real-world situations. At the ${level} level, learners should focus on understanding what ${t} is, why it matters, and how its core rules work in practice. The important definitions — including the concept itself, its variables, and its theoretical basis — form the vocabulary needed to discuss and apply the topic confidently. By mastering ${t}, students prepare themselves for more advanced study and gain a powerful tool for analytical thinking and problem-solving.`;
}
