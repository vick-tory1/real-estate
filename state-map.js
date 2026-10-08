export const stateMappings = Object.freeze({
  Abia: 'htmlsur.html', Adamawa: 'htmlsur.html', 'Akwa Ibom': 'htmlsur.html', Anambra: 'htmlsur.html',
  Bauchi: 'htmlsur.html', Bayelsa: 'htmlsur.html', Benue: 'htmlsur.html', Borno: 'htmlsur.html',
  'Cross River': 'htmlsur.html', Delta: 'htmlsur.html', Ebonyi: 'htmlsur.html', Edo: 'htmlsur.html',
  Ekiti: 'htmlsur.html', Enugu: 'htmlsur.html', Gombe: 'htmlsur.html', Imo: 'htmlsur.html', Jigawa: 'htmlsur.html',
  Kaduna: 'htmlsur.html', Kano: 'htmlsur.html', Katsina: 'htmlsur.html', Kebbi: 'htmlsur.html', Kogi: 'htmlsur.html',
  Kwara: 'htmlsur.html', Lagos: 'htmlsur.html', Nasarawa: 'htmlsur.html', Niger: 'htmlsur.html', Ogun: 'htmlsur.html',
  Ondo: 'htmlsur.html', Osun: 'htmlsur.html', Oyo: 'htmlsur.html', Plateau: 'htmlsur.html', Rivers: 'htmlsur.html',
  Sokoto: 'htmlsur.html', Taraba: 'htmlsur.html', Yobe: 'htmlsur.html', Zamfara: 'htmlsur.html'
});

export function routeSelectedState(state) {
  return stateMappings[state] || null;
}
