
install:

pip install --upgrade google-api-python-client


functions of interest:
get_emails_text(service=None, userId='me', from_address=None, to_address=None, before=None, after=None, keywords=None)
    returns -> [[subject, body],[subject, body]...] 
    
query_emails(service=None, userId='me', from_address=None, to_address=None, before=None, after=None, keywords=None)
    returns -> [{all email info}, {all email info}...]
