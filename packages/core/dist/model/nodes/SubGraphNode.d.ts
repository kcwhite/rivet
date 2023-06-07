import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { GraphId } from '../NodeGraph';
import { Project } from '../Project';
import { InternalProcessContext } from '../ProcessContext';
export type SubGraphNode = ChartNode & {
    type: 'subGraph';
    data: {
        graphId: GraphId;
    };
};
export declare class SubGraphNodeImpl extends NodeImpl<SubGraphNode> {
    static create(): SubGraphNode;
    getInputDefinitions(_connections: NodeConnection[], _nodes: Record<NodeId, ChartNode>, project: Project): NodeInputDefinition[];
    getOutputDefinitions(_connections: NodeConnection[], _nodes: Record<NodeId, ChartNode>, project: Project): NodeOutputDefinition[];
    process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs>;
}
export declare const subGraphNode: import("../NodeImpl").NodeDefinition<SubGraphNode>;
