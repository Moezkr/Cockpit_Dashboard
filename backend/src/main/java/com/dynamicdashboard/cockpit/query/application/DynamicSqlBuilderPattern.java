package com.dynamicdashboard.cockpit.query.application;

import java.util.ArrayList;
import java.util.List;


public class DynamicSqlBuilderPattern {

    private String table;
    private String labelColumn;
    private String valueExpression;
    private String groupByColumn;
    private List<String> selectColumns = new ArrayList<>();
    private int limit = 0;

    private List<String> conditions = new ArrayList<>();

    private DynamicSqlBuilderPattern() {}

    public static DynamicSqlBuilderPattern from(String table) {
        DynamicSqlBuilderPattern b = new DynamicSqlBuilderPattern();
        b.table = table;
        return b;
    }

    public DynamicSqlBuilderPattern groupBy(String column) {
        this.groupByColumn = column;
        this.labelColumn = column;
        return this;
    }

    public DynamicSqlBuilderPattern aggregate(String function, String column) {
        this.valueExpression = function + "(" + column + ")";
        return this;
    }

    public DynamicSqlBuilderPattern selectAll() {
        this.selectColumns = List.of("*");
        return this;
    }

    public DynamicSqlBuilderPattern limit(int n) {
        this.limit = n;
        return this;
    }

    public DynamicSqlBuilderPattern where(String condition) {
        this.conditions.add(condition);
        return this;
    }

    public String build() {
        StringBuilder sql = new StringBuilder("SELECT ");

        if (labelColumn != null && valueExpression != null) {
            sql.append(labelColumn).append(" AS label, ")
               .append(valueExpression).append(" AS value")
               .append(" FROM ").append(table);

            if (!conditions.isEmpty()) {
                sql.append(" WHERE ").append(String.join(" AND ", conditions));
            }

            if (!"'Tous'".equals(groupByColumn)) {
                sql.append(" GROUP BY ").append(groupByColumn);
            }
        } else {
            sql.append(String.join(", ", selectColumns))
               .append(" FROM ").append(table);

            if (!conditions.isEmpty()) {
                sql.append(" WHERE ").append(String.join(" AND ", conditions));
            }
        }

        if (limit > 0) sql.append(" LIMIT ").append(limit);

        return sql.toString();
    }
}
