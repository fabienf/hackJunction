import yaml, os
import numpy as np
# from query_gmail import get_emails_text


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


def filter_by_topic( xs, ts ):
    
    if type( ts ) is not list:
        ts = [ts]


    emails = [ e[0]+' '+e[1] for e in xs]

    filtered = []
    for i in range(len(xs)):
        y = predict( emails[i] )
        if any( [topic in y.keys() for topic in ts] ):
            filtered.append( xs[i] )
    # for x in xs:
    #     y = predict( x )
    #     if any( [topic in y.keys() for topic in ts] ):
    #         filtered.append( x )

    return filtered



# if __name__ == "__main__":
#     from datetime import timedelta
#     from dateutil.parser import parse


#     date   = parse('2016-11-26')
#     ndate  = date + timedelta( 1 )
#     ts = ['sports']

#     # print date.strftime( '%Y-%m-%d' ), ndate.strftime( '%Y-%m-%d' )
#     emails = get_emails_text(
#         # after=date.strftime( '%Y-%m-%d' ),
#         # before=ndate.strftime( '%Y-%m-%d' )
#     )

#     emails = [ e[0]+'\n'+e[1] for e in emails]
#     # print emails

#     emails = filter_by_topic( emails, ts )
#     print emails