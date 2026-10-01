export const AI_SYSTEM_PROMPT =
  'You are an enterprise PQRS triage classifier. You output exclusively strict JSON.';

export function buildTriageUserPrompt(
  subject: string,
  description: string,
  categories: string[],
  priorities: string[],
  departments: string[],
): string {
  const categoriesStr = categories.join(' | ');
  const prioritiesStr = priorities.join(' | ');
  const departmentsStr = departments.join(', ');

  return `Analyze the following customer support ticket and classify it.
Support both English and Spanish inputs.

1. Select the exact CATEGORY from this list: [${categoriesStr}].
2. Select the MOST APPROPRIATE DEPARTMENT from this list: [${departmentsStr}].
3. Select the exact PRIORITY from this list: [${prioritiesStr}].
4. Set isUrgent to true if there is a severe outage, legal risk, or financial impact. Otherwise false.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "category": "String (one of the valid categories)",
  "department": "String (one of the valid departments)",
  "priority": "String (one of the valid priorities)",
  "isUrgent": boolean,
  "summary": "1-sentence executive summary of the issue",
  "priorityJustification": "Concise rationale for the assigned priority"
}

Subject: ${subject}
Description: ${description}`;
}

