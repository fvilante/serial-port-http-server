import { render} from '@testing-library/svelte';
import {expect} from 'chai'
import App from './App.svelte';

describe('<App>', () => {
    it('renders learn posijet link', () => {
        const { getByText } = render(App)
        const linkElement = getByText(/Learn svelte/i)
        expect(document.body.contains(linkElement))
    })
})