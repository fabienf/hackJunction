import yaml, os
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer, TfidfTransformer


# get path of the script
cpath = os.path.dirname(os.path.abspath(__file__)) + '/'

# load parameters
with open( cpath + 'topics.yaml', 'rb' ) as f:
    topics = yaml.safe_load( f )


# create 
keywords = np.concatenate( [
    np.asarray( topic_values ) for topic_values in topics.values()
] )
count_vect = CountVectorizer()
count_vect.fit( keywords )


def preprocessing( data ):

    # tramsform to number of times that the word appear in the text
    X_train_counts = count_vect.transform( data )
    
    # transform to frequency (in [0,1])
    tfidf_transformer = TfidfTransformer()
    X_train_tfidf = tfidf_transformer.fit_transform( X_train_counts )

    return X_train_tfidf


def train( x, y ):
    from sklearn.naive_bayes import MultinomialNB

    return MultinomialNB().fit( x, y )


def predict( x, tau=.1 ):
    # transform the data
    x0 = preprocessing( x )
    print x.shape, keywords.shape
    print x0
    
    # get the keywords with the highest freequency
    ks = keywords[x0 >= tau]

    y = {}
    for k in ks:
        for topic, keys in topics.items():
            if k in keys:
                if not hasattr( y, topic ):
                    y[topic] = 0
                y[topic] += 1

    return y


if __name__ == "__main__":
    from sklearn.datasets import fetch_20newsgroups

    twenty_train = fetch_20newsgroups(subset='train',
            shuffle=True, random_state=42)
    
    print twenty_train.data[0]
    
    print predict( twenty_train.data[0] )
