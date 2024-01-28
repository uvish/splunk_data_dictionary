import styled from 'styled-components';
import { variables, mixins } from '@splunk/themes';

const Container = styled.div`
    height: 50%;
    width: 50%
    display: flex;
    align-items: centre;
    justify-content: centre;
`;

const ScrollContainer = styled.div`
    overflow: scroll
`;

export { Container , ScrollContainer};