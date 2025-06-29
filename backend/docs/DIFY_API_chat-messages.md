# 发送对话消息

> 创建会话消息。

## OpenAPI

````yaml zh-hans/openapi_chatflow.json post /chat-messages
paths:
  path: /chat-messages
  method: post
  servers:
    - url: '{api_base_url}'
      description: API 的基础 URL。请将 {api_base_url} 替换为您的应用提供的实际 API 基础 URL。
      variables:
        api_base_url:
          type: string
          description: 实际的 API 基础 URL
          default: https://api.dify.ai/v1
  request:
    security:
      - title: ApiKeyAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                API-Key 鉴权。所有 API 请求都应在 Authorization HTTP Header 中包含您的
                API-Key，格式为：Bearer {API_KEY}。强烈建议开发者把 API-Key 放在后端存储，而非客户端，以免泄露。
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              query:
                allOf:
                  - type: string
                    description: 用户输入/提问内容。
              inputs:
                allOf:
                  - type: object
                    description: 允许传入 App 定义的各变量值。如果变量是文件类型，请指定一个 InputFileObjectCn 对象。
                    additionalProperties:
                      oneOf:
                        - type: string
                        - type: number
                        - type: boolean
                        - $ref: '#/components/schemas/InputFileObjectCn'
                    default: {}
              response_mode:
                allOf:
                  - type: string
                    enum:
                      - streaming
                      - blocking
                    default: streaming
                    description: >-
                      响应模式。streaming (推荐) 基于 SSE；blocking 等待执行完毕后返回 (Cloudflare
                      100秒超时限制)。
              user:
                allOf:
                  - type: string
                    description: >-
                      用户标识，应用内唯一。**重要说明**: Service API 不共享 WebApp 创建的对话。通过 API
                      创建的对话与 WebApp 界面中创建的对话是相互隔离的。
              conversation_id:
                allOf:
                  - type: string
                    format: uuid
                    description: （选填）会话 ID，用于继续之前的对话。
              files:
                allOf:
                  - type: array
                    items:
                      $ref: '#/components/schemas/InputFileObjectCn'
                    description: （选填）文件列表，仅当模型支持 Vision 能力时可用。
              auto_generate_name:
                allOf:
                  - type: boolean
                    default: true
                    description: （选填）自动生成会话标题，默认 true。
            required: true
            refIdentifier: '#/components/schemas/ChatRequestCn'
            requiredProperties:
              - query
              - user
        examples:
          streaming_with_file:
            summary: 包含文件和自定义输入的流式请求示例
            value:
              inputs:
                name: dify
              query: iPhone 13 Pro Max 的规格是什么？
              response_mode: streaming
              conversation_id: 101b4c97-fc2e-463c-90b1-5261a4cdcafb
              user: abc-123
              files:
                - type: image
                  transfer_method: remote_url
                  url: https://cloud.dify.ai/logo/logo-site.png
        description: 发送对话消息的请求体。
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              event:
                allOf:
                  - type: string
                    example: message
                    description: 事件类型，固定为 `message`。
              task_id:
                allOf:
                  - type: string
                    format: uuid
                    description: 任务 ID。
              id:
                allOf:
                  - type: string
                    format: uuid
                    description: 唯一ID。
              message_id:
                allOf:
                  - type: string
                    format: uuid
                    description: 消息唯一 ID。
              conversation_id:
                allOf:
                  - type: string
                    format: uuid
                    description: 会话 ID。
              mode:
                allOf:
                  - type: string
                    example: chat
                    description: App 模式，固定为 `chat`。
              answer:
                allOf:
                  - type: string
                    description: 完整回复内容。
              metadata:
                allOf:
                  - $ref: '#/components/schemas/ResponseMetadataCn'
              created_at:
                allOf:
                  - type: integer
                    format: int64
                    description: 消息创建时间戳。
            description: 阻塞模式下的完整 App 结果。
            refIdentifier: '#/components/schemas/ChatCompletionResponseCn'
        examples:
          example:
            value:
              event: message
              task_id: 3c90c3cc-0d44-4b50-8888-8dd25736052a
              id: 3c90c3cc-0d44-4b50-8888-8dd25736052a
              message_id: 3c90c3cc-0d44-4b50-8888-8dd25736052a
              conversation_id: 3c90c3cc-0d44-4b50-8888-8dd25736052a
              mode: chat
              answer: <string>
              metadata:
                usage:
                  prompt_tokens: 123
                  prompt_unit_price: <string>
                  prompt_price_unit: <string>
                  prompt_price: <string>
                  completion_tokens: 123
                  completion_unit_price: <string>
                  completion_price_unit: <string>
                  completion_price: <string>
                  total_tokens: 123
                  total_price: <string>
                  currency: <string>
                  latency: 123
                retriever_resources:
                  - position: 123
                    dataset_id: 3c90c3cc-0d44-4b50-8888-8dd25736052a
                    dataset_name: <string>
                    document_id: 3c90c3cc-0d44-4b50-8888-8dd25736052a
                    document_name: <string>
                    segment_id: 3c90c3cc-0d44-4b50-8888-8dd25736052a
                    score: 123
                    content: <string>
              created_at: 123
        description: >-
          请求成功。响应的内容类型和结构取决于请求中的 `response_mode` 参数。

          - 当 `response_mode` 为 `blocking` 时，返回 `application/json` 格式的
          `ChatCompletionResponseCn` 对象。

          - 当 `response_mode` 为 `streaming` 时，返回 `text/event-stream` 格式的
          `ChunkChatEventCn` 对象流式序列。
      text/event-stream:
        schemaArray:
          - type: string
            description: 'SSE 事件流。每个事件以 ''data: '' 开头，以 ''\n\n'' 结尾。具体结构请参见 `ChunkChatEventCn`。'
        examples:
          example:
            value: <string>
        description: >-
          请求成功。响应的内容类型和结构取决于请求中的 `response_mode` 参数。

          - 当 `response_mode` 为 `blocking` 时，返回 `application/json` 格式的
          `ChatCompletionResponseCn` 对象。

          - 当 `response_mode` 为 `streaming` 时，返回 `text/event-stream` 格式的
          `ChunkChatEventCn` 对象流式序列。
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              status:
                allOf:
                  - &ref_0
                    type: integer
                    nullable: true
                    description: HTTP 状态码。
              code:
                allOf:
                  - &ref_1
                    type: string
                    nullable: true
                    description: 错误码。
              message:
                allOf:
                  - &ref_2
                    type: string
                    description: 错误消息。
            description: 错误响应。
            refIdentifier: '#/components/schemas/ErrorResponseCn'
        examples:
          example:
            value:
              status: 123
              code: <string>
              message: <string>
        description: >-
          请求参数错误。可能原因：invalid_param, app_unavailable, provider_not_initialize,
          provider_quota_exceeded, model_currently_not_support,
          completion_request_error。
    '404':
      application/json:
        schemaArray:
          - type: object
            properties:
              status:
                allOf:
                  - *ref_0
              code:
                allOf:
                  - *ref_1
              message:
                allOf:
                  - *ref_2
            description: 错误响应。
            refIdentifier: '#/components/schemas/ErrorResponseCn'
        examples:
          example:
            value:
              status: 123
              code: <string>
              message: <string>
        description: 对话不存在。
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              status:
                allOf:
                  - *ref_0
              code:
                allOf:
                  - *ref_1
              message:
                allOf:
                  - *ref_2
            description: 错误响应。
            refIdentifier: '#/components/schemas/ErrorResponseCn'
        examples:
          example:
            value:
              status: 123
              code: <string>
              message: <string>
        description: 服务内部异常。
  deprecated: false
  type: path
components:
  schemas:
    InputFileObjectCn:
      type: object
      required:
        - type
        - transfer_method
      properties:
        type:
          type: string
          enum:
            - document
            - image
            - audio
            - video
            - custom
          description: >-
            文件类型。document: TXT,MD,PDF等; image: JPG,PNG等; audio: MP3,WAV等; video:
            MP4,MOV等; custom: 其他。
        transfer_method:
          type: string
          enum:
            - remote_url
            - local_file
          description: 传递方式。
        url:
          type: string
          format: url
          description: 图片地址 (当 transfer_method 为 remote_url 时)。
        upload_file_id:
          type: string
          format: uuid
          description: 上传文件 ID (当 transfer_method 为 local_file 时)。
      oneOf:
        - required:
            - url
        - required:
            - upload_file_id
    ResponseMetadataCn:
      type: object
      description: 元数据。
      properties:
        usage:
          $ref: '#/components/schemas/UsageCn'
        retriever_resources:
          type: array
          items:
            $ref: '#/components/schemas/RetrieverResourceCn'
          description: 引用和归属分段列表。
    UsageCn:
      type: object
      description: 模型用量信息。
      properties:
        prompt_tokens:
          type: integer
        prompt_unit_price:
          type: string
        prompt_price_unit:
          type: string
        prompt_price:
          type: string
        completion_tokens:
          type: integer
        completion_unit_price:
          type: string
        completion_price_unit:
          type: string
        completion_price:
          type: string
        total_tokens:
          type: integer
        total_price:
          type: string
        currency:
          type: string
        latency:
          type: number
          format: double
    RetrieverResourceCn:
      type: object
      description: 引用和归属分段信息。
      properties:
        position:
          type: integer
        dataset_id:
          type: string
          format: uuid
        dataset_name:
          type: string
        document_id:
          type: string
          format: uuid
        document_name:
          type: string
        segment_id:
          type: string
          format: uuid
        score:
          type: number
          format: float
        content:
          type: string

````