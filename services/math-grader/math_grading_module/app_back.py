from langchain_core.runnables import RunnableLambda, RunnableBranch
import json

from grading_chain import Grading_Chain

rubric = """
    The student should correctly set up the integral, apply substitution where needed, integrate step-by-step, and simplify the final expression.
    Partial credit should be given if they attempt the right substitution or setup.
"""

question = """
    Evaluate the integral:
    [
    int x e^{-x} dx
    ]

    Provide a step-by-step solution using the method of integration by parts.
"""

model_solution = """
    Integral: ∫ x e^(-x) dx

    Method: Integration by Parts (∫ u dv = uv - ∫ v du)

    Choose u and dv using LIATE rule (Logarithmic, Inverse trig, Algebraic, Trig, Exponential):

    Let u = x → du = dx (Algebraic is simpler to differentiate)

    Let dv = e^(-x) dx → v = ∫ e^(-x) dx = -e^(-x) (Exponential is simpler to integrate)

    Apply the formula ∫ u dv = uv - ∫ v du:
    ∫ x e^(-x) dx = x(-e^(-x)) - ∫ (-e^(-x)) dx

    Simplify and integrate the remaining term:
    ∫ x e^(-x) dx = -x e^(-x) + ∫ e^(-x) dx
    ∫ x e^(-x) dx = -x e^(-x) + (-e^(-x)) + C

    Final Answer (factored):
    ∫ x e^(-x) dx = -e^(-x)(x + 1) + C
"""

student_solution = """
    We want to evaluate the integral $\int x e^{-x} dx$ using **Integration by Parts** formula:
    $\int u dv = uv - \int v du$

    **1. Choose $u$ and $dv$:**
    Following the LIATE rule, we choose the algebraic term for $u$:
    Let $u = x$
    Then $du = dx$

    We choose the exponential term for $dv$:
    Let $dv = e^{-x} dx$
    Then $v = \int e^{-x} dx = -e^{-x}$

    **2. Apply the formula:**
    $\int x e^{-x} dx = u v + \int v du$
    $\int x e^{-x} dx = (x)(-e^{-x}) + \int (-e^{-x})(dx)$

    **3. Simplify and integrate the remaining term:**
    $\int x e^{-x} dx = -x e^{-x} - \int e^{-x} dx$
    $\int x e^{-x} dx = -x e^{-x} - (-e^{-x}) + C$

    **4. Final Answer:**
    $\int x e^{-x} dx = -x e^{-x} - e^{-x} + C$
    (Factored form: $\int x e^{-x} dx = -e^{-x}(x + 1) + C$)
"""

# # overall
# # stepwise
# # subtle_errors
# result = Grading_Chain.invoke({
#     "rubric": rubric,
#     "question": question,
#     "model_solution": model_solution,
#     "student_solution": student_solution,
#     "system_prompt_type": "stepwise"  # optional, defaults to 'overall'
# })

# print(result)

def run_full_grader(rubric, question, model_solution, student_solution, score_threshold=70, strictness_threshold=3):
    grading_results = {}
    
    base_input = {
        "rubric": rubric,
        "question": question,
        "model_solution": model_solution,
        "student_solution": student_solution,
    }
    
    StoreOutputRunnable = RunnableLambda(
        lambda response, section: (
            grading_results.update({section: response}) or response
        )
    )
    
    # overall stage
    Overall_Stage_Chain = ( RunnableLambda(lambda _: Grading_Chain.invoke({**base_input, "system_prompt_type": "overall"})) | 
                            RunnableLambda(lambda response: StoreOutputRunnable.invoke(response, section="overall")) )
    
    Stepwise_Stage_Chain = ( RunnableLambda(lambda _: Grading_Chain.invoke({**base_input, "system_prompt_type": "stepwise"})) | 
                            RunnableLambda(lambda response: StoreOutputRunnable.invoke(response, section="stepwise")) )
    
    Subtle_Errors_Stage_Chain = ( RunnableLambda(lambda _: Grading_Chain.invoke({**base_input, "system_prompt_type": "subtle_errors"})) | 
                            RunnableLambda(lambda response: StoreOutputRunnable.invoke(response, section="subtle_errors")) )
    
    Full_Grader = (
        Overall_Stage_Chain | RunnableBranch(
            (lambda response: response.get("overall_score", 0) >= score_threshold,
                Stepwise_Stage_Chain | RunnableBranch(
                    (lambda _: strictness_threshold >= 3,
                        Subtle_Errors_Stage_Chain),
                    RunnableLambda(lambda _: grading_results)
                )
            ),
            RunnableLambda(lambda _: grading_results)
        )
    )
    
    Full_Grader.invoke(base_input)
    
    return grading_results

# result = run_full_grader(rubric=rubric, question=question, model_solution=model_solution, student_solution=student_solution)

# print("✅ Success!")
# print(json.dumps(result, indent=2))

# # Save to file
# with open("result.json", "w", encoding="utf-8") as f:
#     json.dump(result, f, indent=2, ensure_ascii=False)

# print("📁 Result saved to result.json")

# print()