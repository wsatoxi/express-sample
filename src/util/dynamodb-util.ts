import * as aws from 'aws-sdk'
import { AwsUtil } from './aws-util'
import * as Q from 'q'

export class DynamoDBUtil<TABLE_SCHEMA> extends AwsUtil {
    protected _docClient: aws.DynamoDB.DocumentClient;

    constructor(accessKeyId: string, secretKey: string, region?: string, endpoint?: string) {
        super(accessKeyId, secretKey, region);

        if (endpoint) {
            aws.config.update(<any>{endpoint: endpoint})
        }

        this._docClient = new aws.DynamoDB.DocumentClient();
    }

    public get(params: aws.DynamoDB.DocumentClient.GetItemInput): Q.Promise<TABLE_SCHEMA> {
        let d = Q.defer<TABLE_SCHEMA>();

        this._docClient.get(params, (err, data) => {
            if (err) {
                d.reject(err);
            }else{
                d.resolve(<TABLE_SCHEMA>data.Item);
            }
        })

        return d.promise;
    }

    public put(params: aws.DynamoDB.DocumentClient.PutItemInput): Q.Promise<aws.DynamoDB.DocumentClient.PutItemOutput> {
        let d = Q.defer<aws.DynamoDB.DocumentClient.PutItemOutput>();

        this._docClient.put(params, (err, data) => {
            if (err) {
                d.reject(err);
            }else{
                d.resolve(data);
            }
        })

        return d.promise;
    }

    public query(params: aws.DynamoDB.DocumentClient.QueryInput): Q.Promise<TABLE_SCHEMA[]> {
        let d = Q.defer<TABLE_SCHEMA[]>();

        params.ExclusiveStartKey = null;

        this._query(params, d, []);

        return d.promise;
    }

    private _query(params: aws.DynamoDB.DocumentClient.QueryInput, d: Q.Deferred<TABLE_SCHEMA[]>, result: TABLE_SCHEMA[]) {
        this._docClient.query(params, (err, data) => {
            if (err) {
                d.reject(err);
            } else {
                Array.prototype.push.apply(result, data.Items);
                if (data.LastEvaluatedKey != null && (params.Limit ? result.length < params.Limit : true)) {
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    this._query(params, d, result);
                } else {
                    if (params.Limit && params.Limit < result.length) {
                        result = result.slice(0, params.Limit);
                    }
                    d.resolve(result);
                }
            }
        });
    }

}