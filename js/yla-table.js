var YlaTable = function () {
    var _template = `
        <div class="yla-table">
            <div class="yla-table__header">
                <table :style="{tableLayout: tableLayout}">
                    <thead>
                        <th v-for="(col, idx) in columns" 
                            @click="sort(col)"
                            :class="colClass(col)" 
                            :style="{width: colWidth(idx)}">
                            <slot :name="'header-'+col.name">{{col.label}}</slot>
                        </th>
                        <th class="scroll-bar" :style="{width: scrollWidth+'px'}"></th>
                    </thead>
                </table>
            </div>
            <div class="yla-table__body">
                <div v-if="loading">
                    <i class="fas fa-fw fa-spinner fa-spin"></i>
                </div>
                <div v-else-if="contents.length === 0" style="grid-column: 1/-1; text-align: center">
                    <slot name="empty-message">There are no data available</slot>
                </div>
                <table v-else>
                    <thead>
                        <th v-for="(col, idx) in columns">
                            <slot :name="'header-'+col.name">{{col.label}}</slot>
                        </th>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in contents">
                            <td v-for="col in columns" :style="{textAlign: col.align}">
                                <slot :name="'body-'+col.name" :data="item" :index="idx">{{item[col.name]}}</slot>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot v-if="summary">
                        <th v-for="(col, idx) in columns">{{summary[col.name]}}</th>
                    </tfoot>
                </table>
            </div>
            <div class="yla-table__footer" v-if="summary && contents.length > 0 && !loading">
                <table :style="{tableLayout: tableLayout}">
                    <tfoot>
                        <th v-for="(col, idx) in columns" 
                            :style="{textAlign: col.align, width: colWidth(idx)}">
                            {{summary[col.name]}}
                        </th>
                        <th class="scroll-bar" :style="{width: scrollWidth+'px'}"></th>                        
                    </tfoot>
                </table>
            </div>
        </div>`

    // Private function
    function _getScrollWidth(table) {
        if (!table) return 0;

        var body = table.querySelector('.yla-table__body');
        return body.offsetWidth - body.clientWidth;
    }

    function _getColumnWidth(table) {
        // Make sure the table element is exist
        if (!table) return [];

        // Get elements
        var body = table.querySelector('.yla-table__body'),
            rows = body.querySelectorAll('tr');

        // If there are no rows, stop
        if (rows.length === 0) return [];

        // Get width of each column
        var result = [],
            columns = rows[0].querySelectorAll('td');

        columns.forEach(col => {
            result.push(col.getBoundingClientRect().width);
        });

        return result;
    }

    // Create Vue component
    return {
        template: _template,
        props: {
            loading: Boolean,
            columns: {
                type: Array,
                required: true
            },
            contents: {
                type: Array,
                required: true
            },
            summary: Object
        },
        data() {
            return {
                columnWidth: [],
                scrollWidth: 0,
                sortColumn: '',
                sortDirection: ''
            }
        },
        computed: {
            finalColumns() {
                return this.columns.map((col, idx) => {
                    var columnWidth = _createGridColWidth(col.width, col.minWidth),
                        textAlignment = col.align;

                    if (textAlignment !== 'center' && textAlignment !== 'right') {
                        textAlignment = undefined;
                    }

                    var name = col.name || 'col-' + idx,
                        sortName = col.sortName || name;

                    return {
                        name: name,
                        label: col.label || '',
                        sortable: col.sortable || false,
                        sortName: sortName,
                        width: columnWidth,
                        align: textAlignment
                    }
                });
            },
            tableLayout() {
                if (this.contents.length > 0) return 'fixed';
                return 'auto';
            }
        },
        watch: {
            contents: {
                immediate: true,
                handler() {
                    this.$nextTick(() => {
                        this.scrollWidth = _getScrollWidth(this.$el);
                        this.columnWidth = _getColumnWidth(this.$el);
                    });
                }
            },
            summary: {
                immediate: true,
                handler() {
                    this.$nextTick(() => {
                        this.columnWidth = _getColumnWidth(this.$el);
                    });
                }
            }
        },
        methods: {
            colWidth(index) {
                var width = this.columnWidth[index];
                if (width != null) width += 'px';
                return width;
            },
            colClass(column) {
                var columnName = column.sortName || column.name,
                    isSorted = columnName === this.sortColumn,
                    isDescending = this.sortDirection === 'desc';

                return {
                    sortable: column.sortable,
                    sorted: isSorted,
                    desc: isSorted && isDescending
                }
            },
            sort(column) {
                if (!column.sortable) return;

                var columnName = column.sortName || column.name;
                if (columnName !== this.sortColumn) {
                    this.sortColumn = columnName;
                    this.sortDirection = 'asc';
                } else {
                    if (this.sortDirection === 'desc') {
                        this.sortDirection = 'asc';
                    } else {
                        this.sortDirection = 'desc';
                    }
                }

                this.$emit('sort', this.sortColumn + ' ' + this.sortDirection);
            }
        },
        mounted() {
            this.$nextTick(() => {
                var header = this.$el.querySelector('.yla-table__header'),
                    body = this.$el.querySelector('.yla-table__body'),
                    footer = this.$el.querySelector('.yla-table__footer');

                body.addEventListener('scroll', (e) => {
                    if (footer == null) footer = this.$el.querySelector('.yla-table__footer');
                    header.scrollLeft = body.scrollLeft;
                    footer.scrollLeft = body.scrollLeft;
                });

                window.addEventListener('resize', () => {
                    body.scrollTop = 0;
                    body.scrollLeft = 0;
                    this.columnWidth = _getColumnWidth(this.$el);
                });
            });
        },
        activated() {
            this.$nextTick(() => {
                this.columnWidth = _getColumnWidth(this.$el);
            });
        }
    }
};