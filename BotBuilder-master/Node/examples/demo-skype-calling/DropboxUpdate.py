import dropbox
import requests
import json
from dropbox.client import DropboxClient
import sys






class DropboxUpdate:

    _url = 'https://api.projectoxford.ai/vision/v1/analyses'
    _key = '3ad659dd0a1043a4a90ce07204c3bebd'
    _maxNumRetries = 10

    @staticmethod
    def cluster_all_files():
        #sign in
        dbx = dropbox.Dropbox('F2_PGWfw-GAAAAAAAAAACqNZoyJNzdLMd7x-BKLsGSE7hHM07KRMfT6jJgtWLgub')
        client = DropboxClient('F2_PGWfw-GAAAAAAAAAACqNZoyJNzdLMd7x-BKLsGSE7hHM07KRMfT6jJgtWLgub')
        #debug info

        newFileMeta = None
        cathegory_list = {}
        for entry in dbx.files_list_folder('').entries:
            if '.jpg' in entry.name:
                print(entry.name)
                newFileMeta = entry
                print(newFileMeta.path_lower)
                newFile = dbx.files_download_to_file('tmp/'+newFileMeta.name,newFileMeta.path_lower)
                cath =  (DropboxUpdate.analyzeFile('tmp/'+newFileMeta.name)['categories'][0]['name'])
                link = client.share(newFileMeta.path_lower)['url']
                cathegory_list[link] = cath
                print cathegory_list
                with open('img_dat.txt', 'w') as outfile:
                    json.dump(cathegory_list,outfile)

    @staticmethod
    def classify_file(dbx,file_path,file_name):
        text = Miner.get_text(file_path)
        #keywords = DU.get_full_keywords_for_text(text)
        taxonomy = DU.get_single_best_taxonomy_for_text(text)
        #print keywords
        print taxonomy
        folder_names = {'/law, govt and politics' : 'Law Govt and Politics',
            '/science' : 'Science',
            '/business and industrial' : 'Business and Industrial',
            '/art and entertainment' : 'Art and Entertainment',
            '/education' : 'Education',
            '/finance' : 'Finance',
            '/hobbies and interests' : 'Hobbies and Interests',
            '/news' : 'News',
            '/sports' : 'Sports',
            '/technology and computing' : 'Technology and Computing',
            '/health and fitness' : "Health and Fitness",
            '/travel' : 'Travel'
            }
        #try to create a folder
        folder_name = '/' + taxonomy.split('/')[1]
        print folder_name
        if folder_name in folder_names:
            folder_name = folder_names[folder_name]
        else:
            folder_name = folder_name.split('/')[1]

        try:
            dbx.files_create_folder('/'+folder_name)
        except :
            pass
        dbx.files_move('/'+file_name,'/'+folder_name+'/'+file_name)
        print "File moved sucesfully"

    @staticmethod
    def processRequest( json, data, headers, params ):

        retries = 0
        result = None

        while True:

            response = requests.request( 'post', DropboxUpdate._url, json = json, data = data, headers = headers, params = params )

            if response.status_code == 429: 

                print( "Message: %s" % ( response.json()['error']['message'] ) )

                if retries <= DropboxUpdate._maxNumRetries: 
                    time.sleep(1) 
                    retries += 1
                    continue
                else: 
                    print( 'Error: failed after retrying!' )
                    break

            elif response.status_code == 200 or response.status_code == 201:

                if 'content-length' in response.headers and int(response.headers['content-length']) == 0: 
                    result = None 
                elif 'content-type' in response.headers and isinstance(response.headers['content-type'], str): 
                    if 'application/json' in response.headers['content-type'].lower(): 
                        result = response.json() if response.content else None 
                    elif 'image' in response.headers['content-type'].lower(): 
                        result = response.content
            else:
                print( "Error code: %d" % ( response.status_code ) )
                print( "Message: %s" % ( response.json()['error']['message'] ) )

            break
            
        return result

    @staticmethod
    def analyzeFile(f_path):

            # Load raw image file into memory
        with open( f_path, 'rb' ) as f:
            data = f.read()
            
        # Computer Vision parameters
        params = { 'visualFeatures' : 'Color,Categories'} 

        headers = dict()
        headers['Ocp-Apim-Subscription-Key'] = DropboxUpdate._key
        headers['Content-Type'] = 'application/octet-stream'

        json = None

        result = DropboxUpdate.processRequest( json, data, headers, params )
        return result

    @staticmethod
    def getFileNameByCat(cath):

            # Load raw image file into memory
        with open('img_dat.txt', 'rb' ) as f:
            data = json.load(f)
            
        for name in data:
            if data[name]==cath:
                return name

data = sys.stdin.readline().strip()
print DropboxUpdate.getFileNameByCat(data)

#DropboxUpdate.cluster_all_files()
#print DropboxUpdate.getFileNameByCat('trans_car')

