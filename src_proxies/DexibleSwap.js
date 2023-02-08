const { verify } = require('./RSConfigBuilder');

class FeeDetails {

    static get tupleDefinition() {
        return ('(address,address,uint');
    }

    constructor(props) {
        verify([
            'feeToken',
            'affiliate',
            'affiliatePortion'
        ], props);
        this.feeToken = props.feeToken;
        this.affiliate = props.affiliate;
        this.affiliatePortion = props.affiliatePortion;
    }
}

class ExecutionRequest {
    static get tupleDefinition() {
        return `(address,${FeeDetails.tupleDefinition})`
    }
    constructor(props) {
        verify([
            'requester',
            'fee'
        ], props);
        this.requester = props.requester;
        this.fee = new FeeDetails(props.fee);
    }
}

class TokenAmount {
    static get tupleDefinition() {
        return '(uint112,address)'
    }
    constructor(props) {
        verify([
            'amount',
            'token'
        ], props);
        this.amount = props.amount;
        this.token = props.token;
    }
}

class RouterRequest {
    static get tupleDefinition() {
        return `(address,address,${TokenAmount.tupleDefinition},bytes)`
    }

    constructor(props) {
        verify([
            'router',
            'spender',
            'routeAmount',
            'routerData'
        ], props);
        this.router = props.router;
        this.spender = props.spender;
        this.routeAmount = new TokenAmount(props.routeAmount);
        this.routerData = props.routerData;
    }
}

class SwapRequest {
    static get tupleDefinition() {
        return `(${ExecutionRequest.tupleDefinition},${TokenAmount.tupleDefinition},${TokenAmount.tupleDefinition},${RouterRequest.tupleDefinition}[])`;
    }
    constructor(props) {
        verify([
            'executionRequest',
            'tokenIn',
            'tokenOut',
            'routes'
        ], props);
        this.executionRequest = new ExecutionRequest(props.executionRequest);
        this.tokenIn = new TokenAmount(props.tokenIn);
        this.tokenOut = new TokenAmount(props.tokenOut);
        if (!Array.isArray(props.routes)) {
            throw new Error("Routes must be an array of route objects");
        }
        this.routes = props.routes.map(r => new RouterRequest(r))
    }
}

module.exports = {
    FeeDetails,
    ExecutionRequest,
    TokenAmount,
    RouterRequest,
    SwapRequest
}