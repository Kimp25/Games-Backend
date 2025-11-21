
from google.cloud import firestore
def doc_to_dict(doc):
    data = doc.to_dict()
    data['slug'] = doc.id
    # convert Firestore timestamps if present (leave as-is for client to format)
    return data
