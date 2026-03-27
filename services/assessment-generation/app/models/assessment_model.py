from mongoengine import (
    Document,
    StringField,
    ListField,
    EmbeddedDocument,
    EmbeddedDocumentField,
    ReferenceField,
    IntField,
    DateTimeField,
    DictField,
)
from datetime import datetime


# ---------- Embedded Subdocument for Questions ----------
class Question(EmbeddedDocument):
    question_id = StringField(required=True)
    question_text = StringField(required=True)
    question_type = StringField(
        required=True, choices=("mcq", "short_text", "essay", "math", "coding")
    )
    options = ListField(StringField())                 # For MCQs
    correct_answer = StringField()                     # For MCQs / short
    expected_keywords = ListField(StringField())        # For rubric generation
    marks = IntField(default=1)
    difficulty = StringField(choices=("easy", "medium", "hard"))
    metadata = DictField()                             # Store AI reasoning, tags, etc.


# ---------- Main Assessment Document ----------
class Assessment(Document):
    title = StringField(required=True)
    description = StringField()
    assessment_type = StringField(
        required=True, choices=("assignment", "quiz", "exam")
    )
    source_materials = ListField(StringField())         # URLs, text chunks, book refs
    total_questions = IntField(default=0)
    questions = ListField(EmbeddedDocumentField(Question))
    created_by = StringField(required=True)             # Teacher ID or email
    status = StringField(default="draft", choices=("draft", "final"))
    version = IntField(default=1)
    rubric = DictField()                                # AI-generated rubric if exists
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "assessments",
        "indexes": ["assessment_type", "created_by"],
    }
