const glossary = [
  ['GRI — Gross Rental Income','Total scheduled legal rental income before vacancy, collection loss, operating expenses, or mortgage payments.'],
  ['GPR — Gross Potential Rent','Maximum rent the property could generate if every legal unit were rented for the full period at the assumed rent.'],
  ['EGI — Effective Gross Income','Income expected after vacancy and collection loss, plus other legal recurring property income.'],
  ['NOI — Net Operating Income','EGI minus operating expenses. NOI is calculated before mortgage payments, income taxes, depreciation, and major capital expenditures.'],
  ['OpEx — Operating Expenses','Recurring costs required to operate the property, such as taxes, insurance, repairs, water, utilities, management, and routine reserves.'],
  ['CapEx — Capital Expenditures','Major long-life improvements or replacements such as a roof, boiler, windows, major plumbing, or structural work.'],
  ['Cap Rate — Capitalization Rate','NOI divided by property value or purchase price. It measures the property’s unleveraged operating yield.'],
  ['P&I — Principal and Interest','The principal and interest portion of a mortgage payment.'],
  ['Debt Service','Total required loan payments for a period, usually stated annually for underwriting.'],
  ['DSCR — Debt Service Coverage Ratio','NOI divided by annual debt service. A DSCR above 1.00 means NOI exceeds required debt payments.'],
  ['LTV — Loan-to-Value Ratio','Loan amount divided by the property’s value or purchase price.'],
  ['LTC — Loan-to-Cost Ratio','Loan amount divided by total project cost, commonly used for renovation or development financing.'],
  ['Cash Flow','NOI minus debt service, before income taxes and certain owner-specific expenses.'],
  ['CoC — Cash-on-Cash Return','Annual pre-tax cash flow divided by total cash invested.'],
  ['Debt Yield','NOI divided by loan amount. Lenders use it to measure property income relative to the loan balance.'],
  ['Break-even Occupancy','Approximate occupancy level needed for property income to cover operating expenses and debt service.'],
  ['Vacancy / Collection Loss','Allowance for empty units, turnover, concessions, or rent that is not collected.'],
  ['Total Cash Invested','Down payment plus closing costs, renovation spending, initial reserves, and other cash contributed at acquisition.'],
  ['Equity','Property value minus outstanding debt.'],
  ['ARV — After Repair Value','Estimated property value after planned improvements are completed.'],
  ['Refinance','Replacing the current loan with a new loan, often to improve terms or extract equity.'],
  ['Amortization','The scheduled repayment of a loan over time through principal and interest payments.'],
  ['DCR','Another shorthand sometimes used for Debt Coverage Ratio; in real-estate lending DSCR is the clearer term.'],
  ['CO — Certificate of Occupancy','NYC building record stating the legal use and occupancy of a property where one is required.'],
  ['DOB — Department of Buildings','NYC agency responsible for building records, permits, violations, construction, and occupancy matters.'],
  ['HPD — Housing Preservation & Development','NYC housing agency that maintains property registration, housing code, violations, and related housing records.']
];

document.getElementById('glossary').innerHTML = glossary.map(([term,desc]) => `<div class="glossary-item"><strong>${term}</strong><span>${desc}</span></div>`).join('');

const ids=['price','u1','u2','u3','u4','otherIncome','vacancy','excludedIncome','taxes','insurance','water','repairs','utilities','management','reserve','otherOpex','downPct','rate','term','closing','reno','initialReserve','targetCap','minDscr','minCoc','maxLtv'];
const $=id=>document.getElementById(id);
const n=id=>{const v=parseFloat($(id).value);return Number.isFinite(v)?Math.max(0,v):0};
const money=v=>Number.isFinite(v)?v.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}):'$0';
const pct=v=>Number.isFinite(v)?v.toFixed(2)+'%':'0.00%';

function payment(principal, annualRate, years){
  if(principal<=0)return 0;
  const months=Math.max(1,years*12), r=(annualRate/100)/12;
  if(r===0)return principal/months;
  const f=Math.pow(1+r,months);
  return principal*(r*f)/(f-1);
}
function loanFromPayment(monthlyPayment, annualRate, years){
  if(monthlyPayment<=0)return 0;
  const months=Math.max(1,years*12), r=(annualRate/100)/12;
  if(r===0)return monthlyPayment*months;
  const f=Math.pow(1+r,months);
  return monthlyPayment*(f-1)/(r*f);
}
function renderMetric(label,value){return `<div class="metric"><div class="label">${label}</div><div class="value">${value}</div></div>`}

function calculate(){
  const price=n('price');
  const monthlyRent=n('u1')+n('u2')+n('u3')+n('u4');
  const gri=monthlyRent*12;
  const vacancyRate=Math.min(100,n('vacancy'))/100;
  const vacancyLoss=gri*vacancyRate;
  const egi=(gri-vacancyLoss)+(n('otherIncome')*12);
  const management=egi*(Math.min(100,n('management'))/100);
  const opex=n('taxes')+n('insurance')+n('water')+n('repairs')+n('utilities')+management+n('reserve')+n('otherOpex');
  const noi=egi-opex;
  const downPct=Math.min(100,n('downPct'))/100;
  const down=price*downPct;
  const loan=price-down;
  const monthlyPI=payment(loan,n('rate'),n('term'));
  const annualDebt=monthlyPI*12;
  const cashFlow=noi-annualDebt;
  const capRate=price>0?(noi/price)*100:0;
  const dscr=annualDebt>0?noi/annualDebt:0;
  const ltv=price>0?(loan/price)*100:0;
  const totalCash=down+n('closing')+n('reno')+n('initialReserve');
  const coc=totalCash>0?(cashFlow/totalCash)*100:0;
  const debtYield=loan>0?(noi/loan)*100:0;
  const breakEven=egi>0?((opex+annualDebt)/(gri+(n('otherIncome')*12)))*100:0;
  const targetCap=n('targetCap');
  const capValue=targetCap>0?noi/(targetCap/100):0;
  const minDscr=n('minDscr');
  const dscrMaxAnnualDebt=minDscr>0?Math.max(0,noi/minDscr):0;
  const dscrMaxLoan=loanFromPayment(dscrMaxAnnualDebt/12,n('rate'),n('term'));
  const maxOfferGap=capValue-price;

  const metrics=[
    ['GRI — Gross Rental Income',money(gri)],
    ['Vacancy / Collection Loss',money(vacancyLoss)],
    ['EGI — Effective Gross Income',money(egi)],
    ['Operating Expenses',money(opex)],
    ['NOI — Net Operating Income',money(noi)],
    ['Cap Rate',pct(capRate)],
    ['Down Payment',money(down)],
    ['Loan Amount',money(loan)],
    ['Monthly P&I',money(monthlyPI)],
    ['Annual Debt Service',money(annualDebt)],
    ['DSCR',annualDebt>0?dscr.toFixed(2):'N/A'],
    ['LTV',pct(ltv)],
    ['Annual Cash Flow',money(cashFlow)],
    ['Monthly Cash Flow',money(cashFlow/12)],
    ['Total Cash Invested',money(totalCash)],
    ['CoC Return',totalCash>0?pct(coc):'N/A'],
    ['Debt Yield',loan>0?pct(debtYield):'N/A'],
    ['Break-even Occupancy',pct(breakEven)],
    ['Value @ Target Cap',money(capValue)],
    ['DSCR-Supported Max Loan',money(dscrMaxLoan)],
    ['Price Gap vs Target Cap',(maxOfferGap>=0?'+':'')+money(maxOfferGap)]
  ];
  document.getElementById('metrics').innerHTML=metrics.map(m=>renderMetric(...m)).join('');

  const targetLtv=Math.min(100,n('maxLtv')), minCoc=n('minCoc');
  const tests=[
    ['Cap Rate',pct(capRate),pct(targetCap),capRate>=targetCap],
    ['DSCR',annualDebt>0?dscr.toFixed(2):'N/A',minDscr.toFixed(2),annualDebt===0||dscr>=minDscr],
    ['Cash-on-Cash',totalCash>0?pct(coc):'N/A',pct(minCoc),totalCash>0&&coc>=minCoc],
    ['LTV',pct(ltv),'≤ '+pct(targetLtv),ltv<=targetLtv],
    ['Annual Cash Flow',money(cashFlow),'> $0',cashFlow>0],
    ['NOI',money(noi),'> $0',noi>0]
  ];
  document.getElementById('tests').innerHTML=tests.map(([m,a,t,ok])=>`<tr><td>${m}</td><td>${a}</td><td>${t}</td><td class="${ok?'status-good':'status-bad'}">${ok?'Meets':'Below'}</td></tr>`).join('');

  const passed=tests.filter(x=>x[3]).length;
  let signal='PASS', text='The current base-case assumptions fail several of your underwriting thresholds. Revisit price, rent, expenses, or financing before proceeding.';
  if(noi>0&&cashFlow>0&&passed>=5){signal='BUY / STRONG REVIEW';text='The base-case numbers meet most or all selected thresholds. Continue with legal, physical, title, rent-roll, comparable-sales, lender, and NYC building-record due diligence before making an acquisition decision.'}
  else if(noi>0&&passed>=3){signal='INVESTIGATE';text='The deal shows some workable economics but misses one or more key targets. Review asking price, rents, expenses, financing terms, legal occupancy, and value-creation opportunities.'}
  document.getElementById('signal').textContent=signal;
  document.getElementById('signalText').textContent=text;
  document.getElementById('excludedAnnual').textContent=money(n('excludedIncome')*12);
}

ids.forEach(id=>$(id).addEventListener('input',calculate));
document.getElementById('reset').addEventListener('click',()=>location.reload());
calculate();
