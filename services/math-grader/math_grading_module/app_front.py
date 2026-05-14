import streamlit as st
import json
from app_back import run_full_grader

st.set_page_config(page_title="AI Grading Assistant", layout="wide")

st.title("🧠 AI Grading Assistant")
st.write("Upload or type in your question, rubric, and solutions below to get an AI-generated grading report.")

# --- Input Fields ---
rubric = st.text_area("📋 Rubric", placeholder="Enter the grading rubric...", height=150)
question = st.text_area("❓ Question", placeholder="Enter the question...", height=150)
model_solution = st.text_area("💡 Model Solution", placeholder="Enter the model solution...", height=150)
student_solution = st.text_area("👩‍🎓 Student Solution", placeholder="Enter the student's solution...", height=150)

score_threshold = st.slider("Score Threshold (for Stepwise Evaluation)", 0, 100, 70)
strictness_threshold = st.slider("Strictness Threshold (for Subtle Errors)", 1, 5, 3)

# --- Run the Chain ---
if st.button("🚀 Run Grading Chain"):
    if not all([rubric, question, model_solution, student_solution]):
        st.warning("⚠️ Please fill in all the fields before running the grader.")
    else:
        with st.spinner("Evaluating... Please wait ⏳"):
            try:
                result = run_full_grader(
                    rubric=rubric,
                    question=question,
                    model_solution=model_solution,
                    student_solution=student_solution,
                    score_threshold=score_threshold,
                    strictness_threshold=strictness_threshold
                )
                
                # # --- Display Results ---
                st.success("✅ Grading completed successfully!")
                
                # # Pretty print JSON
                st.subheader("📊 Raw JSON Output")
                st.json(result)
                
                # --- Optional: Clean formatted display ---
                if "overall" in result:
                    st.subheader("🏁 Overall Evaluation")
                    st.write(f"**Score:** {result['overall'].get('overall_score', 'N/A')}")
                    st.write(f"**Reasoning:** {result['overall'].get('reasoning', '')}")
                    
                if "stepwise" in result and isinstance(result["stepwise"], list):
                    st.subheader("🧩 Stepwise Evaluation")
                    for step in result["stepwise"]:
                        with st.expander(f"🔹 {step.get('step_name', 'Unnamed Step')}"):
                            st.write(f"**Score:** {step.get('step_score', 'N/A')}")
                            st.write(f"**Reasoning:** {step.get('step_reasoning', '')}")
                
                if "subtle_errors" in result:
                    st.subheader("⚠️ Subtle Error Analysis")
                    st.write(f"**Strictness Score:** {result['subtle_errors'].get('strictness_score', 'N/A')}")
                    st.write(f"**Reasoning:** {result['subtle_errors'].get('reasoning', '')}")
                    
                # Save result as file option
                with open("result.json", "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
                st.download_button(
                    label="💾 Download Result JSON",
                    data=json.dumps(result, indent=2, ensure_ascii=False),
                    file_name="result.json",
                    mime="application/json"
                )
            except Exception as e:
                st.error(f"❌ Error occurred: {e}")
