import { ref } from 'vue';

export function useFinance() {
    const exchangeRates = ref<any>(null);

    const fetchExchangeRate = async (base: string = 'USD', target: string = 'MXN') => {
        try {
            // Using Frankfurter API (Free, No Key)
            const response = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${target}`);
            const data = await response.json();

            if (data && data.rates) {
                return {
                    base,
                    target,
                    rate: data.rates[target],
                    date: data.date
                };
            }
            return null;
        } catch (e) {
            console.error('Error fetching finance data:', e);
            return null;
        }
    };

    return {
        fetchExchangeRate
    };
}
