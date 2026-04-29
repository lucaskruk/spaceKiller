import { useMemo, useState } from 'react';

type MonthRow = {
  month: string;
  gross: number;
  retirement: number;
  unionFee: number;
  tax: number;
  net: number;
  netAccumulated: number;
};

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

export function App() {
  const [grossMonthly, setGrossMonthly] = useState(1200000);
  const [retirementRate, setRetirementRate] = useState(11);
  const [unionRate, setUnionRate] = useState(2);
  const [incomeTaxRate, setIncomeTaxRate] = useState(15);
  const [annualRaiseRate, setAnnualRaiseRate] = useState(0);

  const rows = useMemo<MonthRow[]>(() => {
    let acc = 0;

    return months.map((month, index) => {
      const adjustedGross = grossMonthly * (1 + (annualRaiseRate / 100) * (index / 12));
      const retirement = adjustedGross * (retirementRate / 100);
      const unionFee = adjustedGross * (unionRate / 100);
      const taxBase = adjustedGross - retirement - unionFee;
      const tax = taxBase * (incomeTaxRate / 100);
      const net = adjustedGross - retirement - unionFee - tax;
      acc += net;

      return {
        month,
        gross: adjustedGross,
        retirement,
        unionFee,
        tax,
        net,
        netAccumulated: acc
      };
    });
  }, [annualRaiseRate, grossMonthly, incomeTaxRate, retirementRate, unionRate]);

  const totals = rows.reduce(
    (sum, row) => ({
      gross: sum.gross + row.gross,
      retirement: sum.retirement + row.retirement,
      unionFee: sum.unionFee + row.unionFee,
      tax: sum.tax + row.tax,
      net: sum.net + row.net
    }),
    { gross: 0, retirement: 0, unionFee: 0, tax: 0, net: 0 }
  );

  return (
    <main className="container">
      <h1>Microtools · Forecast de Sueldos</h1>
      <p>Estimá tu ingreso neto anual a partir de sueldo bruto y retenciones.</p>

      <section className="form-grid">
        <label>
          Sueldo bruto mensual
          <input type="number" min={0} value={grossMonthly} onChange={(e) => setGrossMonthly(Number(e.target.value))} />
        </label>
        <label>
          Jubilación (%)
          <input type="number" min={0} max={100} value={retirementRate} onChange={(e) => setRetirementRate(Number(e.target.value))} />
        </label>
        <label>
          Sindicato (%)
          <input type="number" min={0} max={100} value={unionRate} onChange={(e) => setUnionRate(Number(e.target.value))} />
        </label>
        <label>
          Ganancias (%)
          <input type="number" min={0} max={100} value={incomeTaxRate} onChange={(e) => setIncomeTaxRate(Number(e.target.value))} />
        </label>
        <label>
          Aumento anual estimado (%)
          <input type="number" min={0} max={300} value={annualRaiseRate} onChange={(e) => setAnnualRaiseRate(Number(e.target.value))} />
        </label>
      </section>

      <table>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Bruto</th>
            <th>Jubilación</th>
            <th>Sindicato</th>
            <th>Ganancias</th>
            <th>Neto</th>
            <th>Neto acumulado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              <td>{formatCurrency(row.gross)}</td>
              <td>{formatCurrency(row.retirement)}</td>
              <td>{formatCurrency(row.unionFee)}</td>
              <td>{formatCurrency(row.tax)}</td>
              <td>{formatCurrency(row.net)}</td>
              <td>{formatCurrency(row.netAccumulated)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Total anual</th>
            <th>{formatCurrency(totals.gross)}</th>
            <th>{formatCurrency(totals.retirement)}</th>
            <th>{formatCurrency(totals.unionFee)}</th>
            <th>{formatCurrency(totals.tax)}</th>
            <th>{formatCurrency(totals.net)}</th>
            <th>{formatCurrency(totals.net)}</th>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}
