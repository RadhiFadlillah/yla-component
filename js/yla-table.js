var YlaTable = function () {
    var _template = `
        <div class="yla-table">
            <div class="yla-table__header" 
                 :style="{gridTemplateColumns: headerColumnTemplate}">
                <div v-for="(col, idx) in columns" 
                     :class="colClass(col)" 
                     :style="{width: colWidth(idx)}"
                     @click="sort(col)">
                    <slot :name="'header-'+col.name">{{col.label}}</slot>
                </div>
                <div></div>
            </div>
            <div class="yla-table__body" :style="{gridTemplateColumns: columnTemplate}">
                <div v-if="loading" style="grid-column: 1/-1; text-align: center">
                    <i class="fas fa-fw fa-spinner fa-spin"></i>
                </div>
                <div v-else-if="contents.length === 0" style="grid-column: 1/-1; text-align: center">
                    <slot name="empty-message">There are no data available</slot>
                </div>
                <template v-else>
                    <div v-for="col in columns" class="hidden">{{col.label+' XXX'}}</div>
                    <template v-if="summary && contents.length > 0 && !loading">
                        <div v-for="col in columns" class="hidden">{{summary[col.name]}}</div>
                    </template>
                    <template v-for="(item, idx) in contents">
                        <div v-for="col in columns" :style="{textAlign: col.align}" :class="{strip: (idx % 2 === 1)}">
                            <slot :name="'body-'+col.name" :data="item" :index="idx">{{item[col.name]}}</slot>
                        </div>
                    </template>
                </template>
            </div>
            <div class="yla-table__footer" 
                 v-if="summary && contents.length > 0 && !loading" 
                 :style="{gridTemplateColumns: headerColumnTemplate}">
                <div v-for="(col, idx) in columns" 
                     :style="{textAlign: col.align, width: colWidth(idx)}">
                    {{summary[col.name]}}
                </div>
                <div></div>
            </div>
        </div>`

    // Private function
    function _createColumnTemplate(width, minWidth) {
        if (width === 'content') return 'minmax(min-content, max-content)';
        if (width === 'max-content') return 'max-content';

        var rxSizeUnit = /^\d+(px|em|vw|vh|vm|%|fr)?$/g,
            widthIsSize = rxSizeUnit.test(width),
            minWidthIsSize = rxSizeUnit.test(minWidth),
            min = 'min-content',
            max = '1fr';

        if (widthIsSize) max = width;
        if (minWidthIsSize) min = minWidth;

        return 'minmax(' + min + ',' + max + ')';
    }

    function _getScrollWidth(table) {
        if (!table) return 0;

        var body = table.querySelector('.yla-table__body');
        return body.offsetWidth - body.clientWidth;
    }

    function _getColumnWidth(table, columns, contents) {
        // Make sure the table element is exist
        if (!table) return [];

        // If there are no columns, stop
        if (columns.constructor !== Array) return [];

        // If there are contents, stop
        if (contents.constructor !== Array || contents.length === 0) return [];

        // Get width of each column
        var result = [],
            nColumn = columns.length,
            body = table.querySelector('.yla-table__body');

        for (var i = 0; i < nColumn; i++) {
            var cell = body.children[i];
            if (cell) result.push(cell.offsetWidth);
        }

        return result;
    }

    function _resetScroll(table) {
        // Make sure the table element is exist
        if (!table) return;

        // Get elements
        var header = table.querySelector('.yla-table__header'),
            body = table.querySelector('.yla-table__body'),
            footer = table.querySelector('.yla-table__footer');

        // Reset scroll position
        body.scrollTop = 0;
        body.scrollLeft = 0;
        header.scrollLeft = 0;
        if (footer) footer.scrollLeft = 0;
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
                scrollWidth: 0,
                columnsWidth: [],
                sortColumn: '',
                sortDirection: ''
            }
        },
        computed: {
            columnTemplate() {
                return this.columns
                    .map(col => _createColumnTemplate(col.width, col.minWidth))
                    .join(' ');
            },
            headerColumnTemplate() {
                var templates = this.columns
                    .map(col => _createColumnTemplate(col.width, col.minWidth));

                templates.push(this.scrollWidth + 'px');
                return templates.join(' ');
            },
            finalColumns() {
                return this.columns.map((col, idx) => {
                    var textAlignment = col.align;

                    if (textAlignment !== 'center' && textAlignment !== 'right') {
                        textAlignment = undefined;
                    }

                    return {
                        name: col.name || 'col-' + idx,
                        label: col.label || '',
                        sortable: col.sortable === true,
                        width: col.width,
                        minWidth: col.minWidth,
                        align: textAlignment
                    }
                });
            }
        },
        watch: {
            contents: {
                immediate: true,
                handler() {
                    this.$nextTick(() => {
                        this.scrollWidth = _getScrollWidth(this.$el);
                        this.columnsWidth = _getColumnWidth(this.$el, this.columns, this.contents);
                        _resetScroll(this.$el);
                    });
                }
            },
            summary: {
                immediate: true,
                handler() {
                    this.$nextTick(() => {
                        this.columnsWidth = _getColumnWidth(this.$el, this.columns, this.contents);
                    });
                }
            }
        },
        methods: {
            colWidth(index) {
                var width = this.columnsWidth[index];
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
                    body = this.$el.querySelector('.yla-table__body');

                body.addEventListener('scroll', (e) => {
                    var footer = this.$el.querySelector('.yla-table__footer');

                    header.scrollLeft = body.scrollLeft;
                    if (footer) footer.scrollLeft = body.scrollLeft;
                });

                window.addEventListener('resize', () => {
                    this.scrollWidth = _getScrollWidth(this.$el);
                    this.columnsWidth = _getColumnWidth(this.$el, this.columns, this.contents);
                    _resetScroll(this.$el);
                });
            });
        }
    }
};