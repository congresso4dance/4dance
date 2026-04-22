"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import styles from './analytics.module.css';

interface AnalyticsChartsProps {
  revenueData: any[];
  orderStatusData: any[];
  funnelData: any[];
}

export default function AnalyticsCharts({ revenueData, orderStatusData, funnelData }: AnalyticsChartsProps) {
  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

  return (
    <div className={styles.chartsGrid}>
      {/* 1. Revenue Timeline Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.chartCard}
      >
        <div className={styles.chartHeader}>
          <h3>Evolução de Faturamento</h3>
          <p>Receita bruta acumulada por dia</p>
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ceac66" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ceac66" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `R$${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(20,20,20,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}
                itemStyle={{ color: '#ceac66' }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#ceac66" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRev)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 2. Order Status Distribution */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={styles.chartCard}
      >
        <div className={styles.chartHeader}>
          <h3>Conversão de Pedidos</h3>
          <p>Pagos vs. Pendentes (Desistências)</p>
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ 
                  background: 'rgba(20,20,20,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 3. Engagement Funnel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={styles.chartCard}
        style={{ gridColumn: 'span 2' }}
      >
        <div className={styles.chartHeader}>
          <h3>Funil de Vendas SaaS</h3>
          <p>Jornada do usuário: Lead até a Compra Finalizada</p>
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="rgba(255,255,255,0.5)" 
                fontSize={12} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  background: 'rgba(20,20,20,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 10, 10, 0]}
                barSize={40}
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
