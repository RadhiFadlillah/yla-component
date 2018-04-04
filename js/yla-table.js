var YlaTable = function () {
    var _template = `
        <div class="yla-table" :style="{gridTemplateColumns: columnTemplate}">
            <div class="yla-table__header">
                <div v-for="col in columns">
                    <slot :name="'header-'+col.name">{{col.label}}</slot>
                </div>
            </div>
            <div class="yla-table__body">
                <div v-if="loading" style="grid-column: 1/-1; text-align: center">
                    <i class="fas fa-fw fa-spinner fa-spin"></i>
                </div>
                <div v-else-if="contents.length === 0" style="grid-column: 1/-1; text-align: center">
                    <slot name="empty-message">There are no data available</slot>
                </div>
                <template v-else v-for="(item, idx) in contents">
                    <div v-for="col in columns" :style="{textAlign: col.align}" :class="{strip: (idx % 2 === 1)}">
                        <slot :name="'body-'+col.name" :data="item" :index="idx">{{item[col.name]}}</slot>
                    </div>
                </template>
            </div>
            <div v-if="summary && contents.length > 0" class="yla-table__footer">
                <div v-for="col in columns" :style="{textAlign: col.align}">
                    {{summary[col.name]}}
                </div>
            </div>
        </div>`

    function _createGridColWidth(width, minWidth) {
        if (width === 'content') return 'minmax(min-content, max-content)';

        var rxSizeUnit = /^\d+(px|em|vw|vh|vm|%|fr)?$/g,
            widthIsSize = rxSizeUnit.test(width),
            minWidthIsSize = rxSizeUnit.test(minWidth),
            min = 'min-content',
            max = '1fr';

        if (widthIsSize) max = width;
        if (minWidthIsSize) min = minWidth;

        return 'minmax(' + min + ',' + max + ')';
    }

    function _resizeTableColumn(table, columns, contents) {
        // Make sure the table element is exist
        if (!table) return;

        // Set default parameter
        columns = columns || [];
        contents = contents || [];

        // Check which column that fills width
        var rxFiller = /\d+fr\s*$/g;
        isFillerCol = columns.map(col => {
            return col.width === 'auto' || rxFiller.test(col.width);
        });

        // Fetch sub element of the table
        var header = table.querySelector('.yla-table__header'),
            body = table.querySelector('.yla-table__body'),
            footer = table.querySelector('.yla-table__footer');

        // At least header and body must exist
        if (!header || !body) return;

        // Clear existing column width
        var nColumn = columns.length;
        for (var i = 0; i < nColumn; i++) {
            var headerCell, bodyCell, footerCell;

            headerCell = header.children[i];
            bodyCell = body.children[i];
            if (footer) footerCell = footer.children[i];

            if (headerCell) headerCell.style.width = null;
            if (bodyCell) bodyCell.style.width = null;
            if (footerCell) footerCell.style.width = null;
        }

        // Make sure table data is not empty
        if (contents.length === 0) return;

        // Set new column width
        for (var i = 0; i < nColumn; i++) {
            // If this column fill the table width, don't set the size
            if (isFillerCol[i]) continue;

            // Fetch cells
            var headerCell, bodyCell, footerCell, maxWidth;
            headerCell = header.children[i];
            bodyCell = body.children[i];
            if (footer) footerCell = footer.children[i];

            // Compare the largest width
            if (headerCell) maxWidth = headerCell.offsetWidth;
            if (bodyCell && bodyCell.offsetWidth > maxWidth) maxWidth = bodyCell.offsetWidth;
            if (footerCell && footerCell.offsetWidth > maxWidth) maxWidth = footerCell.offsetWidth;

            // Set the max width
            if (headerCell) headerCell.style.width = maxWidth + 'px';
            if (bodyCell) bodyCell.style.width = maxWidth + 'px';
            if (footerCell) footerCell.style.width = maxWidth + 'px';
        }
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
        computed: {
            columnTemplate() {
                return this.columns
                    .map(col => _createGridColWidth(col.width, col.minWidth))
                    .join(' ');
            },
            finalColumns() {
                return this.columns.map((col, idx) => {
                    var columnWidth = _createGridColWidth(col.width, col.minWidth),
                        textAlignment = col.align;

                    if (textAlignment !== 'center' && textAlignment !== 'right') {
                        textAlignment = undefined;
                    }

                    return {
                        name: col.name || 'col-' + idx,
                        label: col.label || '',
                        sortable: col.sortable || false,
                        clickable: col.clickable || false,
                        width: columnWidth,
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
                        _resizeTableColumn(this.$el, this.columns, this.contents)
                    });
                }
            },
            summary: {
                immediate: true,
                handler() {
                    this.$nextTick(() => {
                        _resizeTableColumn(this.$el, this.columns, this.contents)
                    });
                }
            }
        },
        mounted: function () {
            this.$nextTick(() => {
                window.addEventListener('resize', () => {
                    _resizeTableColumn(this.$el, this.columns, this.contents);
                });
            });
        }
    }
};