
from __future__ import print_function
import httplib2
import os

from apiclient import discovery
from oauth2client import client
from oauth2client import tools
from oauth2client.file import Storage

from gensim.summarization import summarize, keywords

import fileinput
import json

from IPython import embed

# try:
#     import argparse
#     flags = argparse.ArgumentParser(parents=[tools.argparser]).parse_args()
# except ImportError:
#     flags = None

# If modifying these scopes, delete your previously saved credentials
# at ~/.credentials/gmail-python-quickstart.json
SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'
CLIENT_SECRET_FILE = 'client_secret.json'
APPLICATION_NAME = 'Gmail API Python Quickstart'


def get_credentials():
    """Gets valid user credentials from storage.

    If nothing has been stored, or if the stored credentials are invalid,
    the OAuth2 flow is completed to obtain the new credentials.

    Returns:
        Credentials, the obtained credential.
    """
    home_dir = os.path.expanduser('.')
    credential_dir = os.path.join(home_dir, '.credentials')
    if not os.path.exists(credential_dir):
        os.makedirs(credential_dir)
    credential_path = os.path.join(credential_dir,
                                   'gmail-python-quickstart.json')

    store = Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
        flow.user_agent = APPLICATION_NAME
        if flags:
            credentials = tools.run_flow(flow, store, flags)
        else: # Needed only for compatibility with Python 2.6
            credentials = tools.run(flow, store)
        print('Storing credentials to ' + credential_path)
    return credentials

def query_emails(service=None, userId='me', from_address=None, to_address=None, before=None, after=None, keywords=None):  
    query = ""

    if service is None:
        """really only for hackathon purposes (expecting hardcoded credentials)"""
        credentials = get_credentials()
        http = credentials.authorize(httplib2.Http())
        service = discovery.build('gmail', 'v1', http=http)

    if from_address is not None:
        query += "from:("+from_address+") "

    if to_address is not None:
        query += "to:("+to_address+") "

    if before is not None:
        query += "before:("+before+") "

    if after is not None:
        query += "after:("+after+") "

    if keywords is not None:
        query += keywords

    # print ([from_address])

    mail_ids = service.users().messages().list(userId=userId, q=query).execute()

    messages = []
    for i in range(mail_ids['resultSizeEstimate']):
        messages.append( service.users().messages().get(userId=userId, id=mail_ids['messages'][i]['id']).execute() )

    return messages



def get_subject(message):
    """in: one email as json
       out: subject of the email """
    for e in message['payload']['headers']:
        if e['name']== 'Subject':
            return e['value']


def get_emails_text(service=None, userId='me', from_address=None, to_address=None, before=None, after=None, keywords=None):
    messages = query_emails(service, userId, from_address, to_address, before, after, keywords)

    messages_text = []
    for i in range(len(messages)):
        # subject = str(get_subject(messages[i]))  # str to convert from unicode to string
        # body = str( messages[i]['snippet'] )
        subject = get_subject(messages[i])  # str to convert from unicode to string
        body = messages[i]['snippet'] 
        messages_text.append([subject,body])

    return messages_text


def summarize_email(email):
    summary = ""
    text = email[0] + ' ' + email[1]
 
    try:
        summary = summarize(text)
    except Exception, e:
        pass

    return summary


def get_keywords(email):
    keywords_list = []
    text = email[0] + ' ' + email[1]
 
    try:
        keywords_list = keywords(text)
    except Exception, e:
        pass

    return keywords_list

def main():
    """Gmail API."""
    # credentials = get_credentials()
    # http = credentials.authorize(httplib2.Http())
    # service = discovery.build('gmail', 'v1', http=http)


    # messages = query_emails(service)

    # # print(messages[1])

    # for i in range(len(messages)):
    #     print( get_subject(messages[i])) 
    #     print( messages[i]['snippet'] + "\n")

    params = ""
    for line in fileinput.input():
        params += line

    # embed()
    # print(params)
    params = json.loads(params)
    # print([type(params)]) 

    from_address=None 
    to_address=None 
    before=None 
    after=None
    keywords=None

    if "from_address" in params.keys():
        from_address = params["from_address"]
    if "to_address" in params.keys():
        to_address = params["to_address"]
    if "before" in params.keys():
        before = params["before"]
    if "after" in params.keys():
        after = params["after"]
    if "keywords" in params.keys():
        keywords = params["keywords"]

    emails = get_emails_text(from_address=from_address, to_address=to_address, before=before, after=after, keywords=keywords)

    # print(emails)
    print(json.dumps(emails))

    # print(summarize_email(emails[0]))
    # print(get_keywords(emails[0]))
    # embed()
    # print messages[1]['snippet']


if __name__ == '__main__':
    main()
