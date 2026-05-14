# OMRChecker Microservice

This is the OMR (Optical Mark Recognition) processing microservice for the Checkmate system. It provides a stateless API wrapper around the `OMRChecker` engine, evaluating sheets directly via API endpoints without persisting any answers or images locally.

## Setup Instructions

1. **Clone the Engine**: 
   Ensure `OMRChecker` repository is cloned within this folder.
   ```bash
   git clone https://github.com/Udayraj123/OMRChecker.git
   ```

2. **Initialize Environment**:
   Create a Python virtual environment and activate it.
   ```bash
   python -m venv venv
   call venv\Scripts\activate.bat   # Windows
   ```

3. **Install Dependencies**:
   Install the necessary libraries for the Flask wrapper and OMR engine.
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

Start the Flask server:
```bash
python app.py
```
**Default Port:** `5004`

## API Endpoints

### `POST /api/evaluate-single-omr`
Evaluates a single OMR sheet based on test configurations.

**Form-Data Arguments:**
- `image` (File): The cropped image of the OMR sheet to evaluate.
- `template` (String / JSON): The defined `template.json` structure of what the sheet physically looks like.
- `evaluation` (String / JSON): The dynamically generated `evaluation.json` answer key mapping `questions_in_order` to their respective correct solutions.

**Returns:**
A structured JSON containing the specific grade metrics and an array of individual question verdicts.
