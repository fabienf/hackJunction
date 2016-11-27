import yaml, os
import numpy as np


# get path of the script
cpath = os.path.dirname(os.path.abspath(__file__)) + '/'

# load parameters
with open( cpath + 'topics.yaml', 'rb' ) as f:
    topics = yaml.safe_load( f )


# create 
keywords = np.concatenate( [
    np.asarray( topic_values ) for topic_values in topics.values()
] )


def preprocessing( data ):

    data = data.lower().split()

    x = np.zeros( len( keywords ), dtype=float )

    for i, k in enumerate( keywords ):
        x[i] = data.count( k )
    
    Z = len( data ) if len( data ) > 0 else 1.
    
    return x / Z
    

def predict( x, tau=.02 ):
    # transform the data
    x = preprocessing( x )
    
    # get the keywords with the highest freequency
    ks = keywords[x >= tau]

    y = {}
    for k in ks:
        for topic, keys in topics.items():
            if k in keys:
                if not hasattr( y, topic ):
                    y[topic] = 0
                y[topic] += 1

    return y


def major_topic( y ):

    if len( y ) == 0:
        return None, 1.
    
    confusion_idx = 0
    z = y.keys()[0]
    for topic, w in y.items():
        if y[z] == w:
            confusion_idx += 1
        if y[z] < w:
            z = topic
    
    return z, 1. / confusion_idx


def filter_by_topic( xs, topics ):
    
    if type( topics ) is not list:
        topics = [topics]

    filtered = []
    for x in xs:
        y = predict( x )
        if any( [topic in y.keys() for topic in topics] ):
            filtered.append( x )
            print y

    return filtered



if __name__ == "__main__":
    import sys
    from sklearn.datasets import fetch_20newsgroups

    twenty_train = fetch_20newsgroups(subset='train',
            shuffle=True, random_state=42)

    mails = filter_by_topic( twenty_train.data, ['sports', 'weather'] )
        
    # for i in xrange( len( twenty_train.data ) ):
    #     y = predict( twenty_train.data[i] )
    #     z, c = major_topic( y )
    #     if len( y ) > 0:
    #         print z, c
    