import { FC, useMemo } from 'react';
import { css } from '@emotion/react';
import { RenderDataValue } from '../RenderDataValue';
import { ChatNode, Outputs, PortId, coerceTypeOptional, inferType, isArrayDataValue } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import styled from '@emotion/styled';
import Toggle from '@atlaskit/toggle';
import { useToggle } from 'ahooks';
import { marked } from 'marked';
import clsx from 'clsx';

type ChatNodeBodyProps = {
  node: ChatNode;
};

const bodyStyles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.multi-message {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

export const ChatNodeBody: FC<ChatNodeBodyProps> = ({ node }) => {
  return (
    <div css={bodyStyles}>
      <div>{node.data.useMaxTokensInput ? 'Max Tokens: (Using Input)' : node.data.maxTokens} tokens</div>
      <div>{node.data.useModelInput ? 'Model: (Using Input)' : node.data.model}</div>
      <div>
        {node.data.useTopP ? 'Top P' : 'Temperature'}:{' '}
        {node.data.useTopP
          ? node.data.useTopPInput
            ? '(Using Input)'
            : node.data.top_p
          : node.data.useTemperatureInput
          ? '(Using Input)'
          : node.data.temperature}
      </div>
      {node.data.useStop && <div>Stop: {node.data.useStopInput ? '(Using Input)' : node.data.stop}</div>}
      {(node.data.frequencyPenalty ?? 0) !== 0 && (
        <div>
          Frequency Penalty: {node.data.useFrequencyPenaltyInput ? '(Using Input)' : node.data.frequencyPenalty}
        </div>
      )}
      {(node.data.presencePenalty ?? 0) !== 0 && (
        <div>Presence Penalty: {node.data.usePresencePenaltyInput ? '(Using Input)' : node.data.presencePenalty}</div>
      )}
    </div>
  );
};

export const ChatNodeOutput: FC<{
  outputs: Outputs;
  fullscreen?: boolean;
}> = ({ outputs, fullscreen }) => {
  if (isArrayDataValue(outputs['response' as PortId]) || isArrayDataValue(outputs['requestTokens' as PortId])) {
    const outputTextAll = coerceTypeOptional(outputs['response' as PortId], 'string[]') ?? [];

    const requestTokensAll = coerceTypeOptional(outputs['requestTokens' as PortId], 'number[]') ?? [];
    const responseTokensAll = coerceTypeOptional(outputs['responseTokens' as PortId], 'number[]') ?? [];
    const costAll = coerceTypeOptional(outputs['cost' as PortId], 'number[]') ?? [];
    const durationAll = coerceTypeOptional(outputs['duration' as PortId], 'number[]') ?? [];

    const functionCallOutput = outputs['function-call' as PortId];
    const functionCallAll =
      functionCallOutput?.type === 'object[]'
        ? functionCallOutput.value.map((v) => JSON.stringify(v))
        : coerceTypeOptional(functionCallOutput, 'string[]');

    return (
      <div className="multi-message" css={bodyStyles}>
        {outputTextAll.map((outputText, index) => {
          const requestTokens = requestTokensAll?.[index];
          const responseTokens = responseTokensAll?.[index];
          const cost = costAll?.[index];
          const duration = durationAll?.[index];
          const functionCall = functionCallAll?.[index];

          return (
            <ChatNodeOutputSingle
              key={index}
              outputText={outputText}
              requestTokens={requestTokens}
              responseTokens={responseTokens}
              cost={cost}
              duration={duration}
              functionCall={functionCall}
              fullscreen={fullscreen}
            />
          );
        })}
      </div>
    );
  } else {
    const outputText = coerceTypeOptional(outputs['response' as PortId], 'string');

    const requestTokens = coerceTypeOptional(outputs['requestTokens' as PortId], 'number');
    const responseTokens = coerceTypeOptional(outputs['responseTokens' as PortId], 'number');
    const cost = coerceTypeOptional(outputs['cost' as PortId], 'number');
    const duration = coerceTypeOptional(outputs['duration' as PortId], 'number');

    const functionCallOutput = outputs['function-call' as PortId];
    const functionCall =
      functionCallOutput?.type === 'object'
        ? JSON.stringify(functionCallOutput.value)
        : coerceTypeOptional(functionCallOutput, 'string');

    return (
      <ChatNodeOutputSingle
        outputText={outputText}
        requestTokens={requestTokens}
        responseTokens={responseTokens}
        cost={cost}
        functionCall={functionCall}
        duration={duration}
        fullscreen={fullscreen}
      />
    );
  }
};

const ChatNodeOutputContainer = styled.div`
  .function-call h4 {
    margin-top: 0;
    margin-bottom: 0;
    text-decoration: none;
    font-size: 12px;
    font-weight: normal;
    color: var(--primary);
  }

  .markdown-toggle {
    display: flex;
    align-items: center;
    margin-right: 80px;
  }

  .metaInfo {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  &.fullscreen .metaInfo {
    padding: 10px;
    border-bottom: 1px solid var(--grey-darkish);
  }

  &.fullscreen .outputText {
    padding: 10px;
  }
`;

export const ChatNodeOutputSingle: FC<{
  outputText: string | undefined;
  functionCall: string | undefined;
  requestTokens: number | undefined;
  responseTokens: number | undefined;
  cost: number | undefined;
  duration: number | undefined;
  fullscreen?: boolean;
}> = ({ outputText, functionCall, requestTokens, responseTokens, cost, duration, fullscreen }) => {
  const [renderMarkdown, toggleRenderMarkdown] = useToggle(fullscreen);

  const outputHtml = useMemo(() => ({ __html: marked(outputText ?? '', { mangle: false }) }), [outputText]);

  return (
    <ChatNodeOutputContainer className={clsx({ fullscreen })}>
      {(responseTokens != null || requestTokens != null || cost != null) && (
        <div className="metaInfo">
          <div style={{ marginBottom: 8 }}>
            {(requestTokens ?? 0) > 0 && (
              <div>
                <em>Request Tokens: {requestTokens}</em>
              </div>
            )}
            {(responseTokens ?? 0) > 0 && (
              <div>
                <em>Response Tokens: {responseTokens}</em>
              </div>
            )}
            {(cost ?? 0) > 0 && (
              <div>
                <em>${cost!.toFixed(3)}</em>
              </div>
            )}
            {(duration ?? 0) > 0 && (
              <div>
                <em>Duration: {duration}ms</em>
              </div>
            )}
          </div>
          {fullscreen && (
            <label className="markdown-toggle">
              <Toggle isChecked={renderMarkdown} onChange={toggleRenderMarkdown.toggle} /> Render Markdown
            </label>
          )}
        </div>
      )}

      <div className={clsx('outputText', { markdown: renderMarkdown })}>
        {renderMarkdown ? (
          <div dangerouslySetInnerHTML={outputHtml} />
        ) : (
          <div className="pre-wrap">
            <RenderDataValue value={inferType(outputText)} />
          </div>
        )}
      </div>
      {functionCall && (
        <div className="function-call">
          <h4>Function Call:</h4>
          <div className="pre-wrap">
            <RenderDataValue value={inferType(functionCall)} />
          </div>
        </div>
      )}
    </ChatNodeOutputContainer>
  );
};

const ChatNodeFullscreenOutput: FC<{
  outputs: Outputs;
}> = ({ outputs }) => {
  return <ChatNodeOutput outputs={outputs} fullscreen />;
};

export const chatNodeDescriptor: NodeComponentDescriptor<'chat'> = {
  Body: ChatNodeBody,
  OutputSimple: ChatNodeOutput,
  FullscreenOutputSimple: ChatNodeFullscreenOutput,
};
